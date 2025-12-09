"use client";

import { useClerk, useUser } from "@clerk/nextjs";
import { track } from "@vercel/analytics";
import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

interface BlogPost {
	id: string;
	slug: string;
	title: string;
	link: string;
	published: string;
	content?: string;
}

interface Comment {
	_id: Id<"comments">;
	postUrl: string;
	userId: Id<"users">;
	content: string;
	createdAt: number;
	parentId?: Id<"comments">;
	username: string;
}

const COMMENTS_PER_PAGE = 5;

export default function BlogPostPage() {
	const params = useParams();
	const slug = decodeURIComponent(params.id as string);
	const { user, isSignedIn } = useUser();
	const { openSignIn } = useClerk();

	const [post, setPost] = useState<BlogPost | null>(null);
	const [loading, setLoading] = useState(true);
	const [commentText, setCommentText] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const commentInputRef = useRef<HTMLTextAreaElement>(null);

	// Restore saved comment from localStorage on mount and scroll to input
	useEffect(() => {
		const savedComment = localStorage.getItem(`draft-comment-${slug}`);
		if (savedComment) {
			setCommentText(savedComment);
			// Scroll to comment input after a brief delay to ensure DOM is ready
			setTimeout(() => {
				commentInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
				commentInputRef.current?.focus();
			}, 100);
		}
	}, [slug]);

	// Save comment to localStorage when it changes
	useEffect(() => {
		if (commentText) {
			localStorage.setItem(`draft-comment-${slug}`, commentText);
		} else {
			localStorage.removeItem(`draft-comment-${slug}`);
		}
	}, [commentText, slug]);
	const [replyingTo, setReplyingTo] = useState<Id<"comments"> | null>(null);
	const [replyText, setReplyText] = useState("");
	const [editingId, setEditingId] = useState<Id<"comments"> | null>(null);
	const [editText, setEditText] = useState("");

	// Pagination state
	const [cursor, setCursor] = useState<number | undefined>(undefined);
	const [allComments, setAllComments] = useState<Comment[]>([]);
	const [hasMore, setHasMore] = useState(true);
	const [loadingMore, setLoadingMore] = useState(false);

	// Use full URL for comments (keeps existing comments working)
	const postUrl = post?.id || `https://blog.tetraslam.world/${slug}`;

	// Get paginated comments
	const paginatedResult = useQuery(
		api.comments.getPaginated,
		post ? { postUrl, limit: COMMENTS_PER_PAGE, cursor } : "skip"
	);

	// Get total count for display
	const totalCount = useQuery(
		api.comments.getCount,
		post ? { postUrl } : "skip"
	);

	const addComment = useMutation(api.comments.create);
	const updateComment = useMutation(api.comments.update);
	const deleteComment = useMutation(api.comments.remove);
	const getOrCreateUser = useMutation(api.users.getOrCreate);

	// Get current user's Convex ID
	const dbUser = useQuery(
		api.users.getByClerkId,
		user?.id ? { clerkId: user.id } : "skip"
	);

	useEffect(() => {
		async function fetchPost() {
			try {
				const res = await fetch(`/api/blog/${encodeURIComponent(slug)}`);
				const data = await res.json();
				setPost(data.post);
			} catch (err) {
				console.error("Failed to fetch post:", err);
			} finally {
				setLoading(false);
			}
		}
		fetchPost();
	}, [slug]);

	// Update comments when paginated result changes
	useEffect(() => {
		if (paginatedResult) {
			if (cursor === undefined) {
				// First load
				setAllComments(paginatedResult.comments);
			} else {
				// Loading more - merge new comments, avoiding duplicates
				setAllComments((prev) => {
					const existingIds = new Set(prev.map((c) => c._id));
					const newComments = paginatedResult.comments.filter(
						(c) => !existingIds.has(c._id)
					);
					return [...prev, ...newComments];
				});
			}
			setHasMore(paginatedResult.nextCursor !== null);
			setLoadingMore(false);
		}
	}, [paginatedResult, cursor]);

	// Reset comments when a new comment is added
	const refreshComments = useCallback(() => {
		setCursor(undefined);
		setAllComments([]);
		setHasMore(true);
	}, []);

	const handleLoadMore = () => {
		if (paginatedResult?.nextCursor && !loadingMore) {
			setLoadingMore(true);
			setCursor(paginatedResult.nextCursor);
		}
	};

	// Organize comments into tree structure
	const commentTree = useMemo(
		() => organizeComments(allComments),
		[allComments]
	);

	const handleSubmitComment = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!commentText.trim()) return;

		// If not signed in, open sign-in modal (comment is preserved in localStorage)
		if (!isSignedIn || !user) {
			openSignIn();
			return;
		}

		setSubmitting(true);
		try {
			const userRecord = await getOrCreateUser({
				clerkId: user.id,
				username: user.username || user.firstName || undefined,
			});

			if (!userRecord) throw new Error("Failed to get/create user");

			await addComment({
				postUrl,
				userId: userRecord._id,
				content: commentText.trim(),
			});
			track("comment_submit", { post_slug: slug, type: "comment" });
			setCommentText("");
			localStorage.removeItem(`draft-comment-${slug}`);
			refreshComments();
		} catch (err) {
			console.error("Failed to add comment:", err);
		} finally {
			setSubmitting(false);
		}
	};

	const handleReply = async (parentId: Id<"comments">) => {
		if (!replyText.trim() || !isSignedIn || !user) return;

		setSubmitting(true);
		try {
			const userRecord = await getOrCreateUser({
				clerkId: user.id,
				username: user.username || user.firstName || undefined,
			});

			if (!userRecord) throw new Error("Failed to get/create user");

			await addComment({
				postUrl,
				userId: userRecord._id,
				content: replyText.trim(),
				parentId,
			});
			track("comment_submit", { post_slug: slug, type: "reply" });
			setReplyText("");
			setReplyingTo(null);
			refreshComments();
		} catch (err) {
			console.error("Failed to reply:", err);
		} finally {
			setSubmitting(false);
		}
	};

	const handleEdit = async (commentId: Id<"comments">) => {
		if (!editText.trim() || !dbUser) return;

		setSubmitting(true);
		try {
			await updateComment({
				id: commentId,
				userId: dbUser._id,
				content: editText.trim(),
			});
			setEditingId(null);
			setEditText("");
		} catch (err) {
			console.error("Failed to edit:", err);
		} finally {
			setSubmitting(false);
		}
	};

	const handleDelete = async (commentId: Id<"comments">) => {
		if (!dbUser) return;
		if (!confirm("Delete this comment?")) return;

		try {
			await deleteComment({ id: commentId, userId: dbUser._id });
			refreshComments();
		} catch (err) {
			console.error("Failed to delete:", err);
		}
	};

	if (loading) {
		return (
			<div className="max-w-4xl mx-auto px-4 py-12">
				<div className="text-muted-foreground text-center animate-pulse-subtle">
					loading...
				</div>
			</div>
		);
	}

	if (!post) {
		return (
			<div className="max-w-4xl mx-auto px-4 py-12">
				<div className="text-center">
					<h1 className="text-2xl font-bold text-rose">post not found</h1>
					<Link
						href="/blog"
						className="text-rose-deep hover:text-rose mt-4 inline-block"
					>
						&larr; back to blog
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div className="max-w-4xl mx-auto px-4 py-12 animate-fade-in">
			<Link href="/blog" className="text-sm text-rose-deep hover:text-rose mb-4 inline-block">
				&larr; back to blog
			</Link>

			{/* Main content container with solid background */}
			<div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg p-6 md:p-8 shadow-lg">
				<div className="space-y-8">
					<article className="blog-content">
						<header className="mb-8">
							<h1 className="text-3xl font-bold">{post.title}</h1>
							<time className="text-sm text-muted-foreground block mt-2">
								{new Date(post.published).toLocaleDateString("en-US", {
									year: "numeric",
									month: "long",
									day: "numeric",
								})}
							</time>
							<a
								href={post.link}
								target="_blank"
								rel="noopener noreferrer"
								className="text-xs text-rose-deep hover:text-rose mt-1 inline-block"
							>
								view original &rarr;
							</a>
						</header>

						{post.content && (
							<div
								className="blog-post-content"
								dangerouslySetInnerHTML={{ __html: post.content }}
							/>
						)}
					</article>

				{/* Comments section */}
				<section className="border-t border-border pt-8">
				<h2 className="text-xl font-semibold text-rose mb-4">
					comments ({totalCount ?? 0})
				</h2>

				{/* Comment form */}
				<form onSubmit={handleSubmitComment} className="mb-6">
					<textarea
						ref={commentInputRef}
						value={commentText}
						onChange={(e) => setCommentText(e.target.value)}
						placeholder="leave a comment..."
						className="w-full px-4 py-3 bg-surface border border-border rounded focus:outline-none focus:border-rose/50 text-foreground placeholder:text-muted-foreground resize-none"
						rows={3}
						disabled={submitting}
					/>
					<div className="flex items-center gap-3 mt-2">
						<button
							type="submit"
							disabled={!commentText.trim() || submitting}
							className="px-4 py-2 bg-rose text-background rounded hover:bg-rose-deep transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{submitting ? "posting..." : "post comment"}
						</button>
						{!isSignedIn && commentText.trim() && (
							<span className="text-xs text-muted-foreground">
								you'll be asked to sign in
							</span>
						)}
					</div>
				</form>

				{/* Comments list */}
				{!paginatedResult ? (
					<div className="text-muted-foreground text-center py-4 animate-pulse-subtle">
						loading comments...
					</div>
				) : allComments.length === 0 ? (
					<div className="text-muted-foreground text-center py-4">
						no comments yet. be the first!
					</div>
				) : (
					<div className="space-y-4">
						{commentTree.map((comment) => (
							<CommentThread
								key={comment._id}
								comment={comment}
								replies={comment.replies}
								currentUserId={dbUser?._id}
								isSignedIn={!!isSignedIn}
								replyingTo={replyingTo}
								setReplyingTo={setReplyingTo}
								replyText={replyText}
								setReplyText={setReplyText}
								editingId={editingId}
								setEditingId={setEditingId}
								editText={editText}
								setEditText={setEditText}
								submitting={submitting}
								onReply={handleReply}
								onEdit={handleEdit}
								onDelete={handleDelete}
							/>
						))}

						{/* Load more button */}
						{hasMore && (
							<div className="pt-4 text-center">
								<button
									onClick={handleLoadMore}
									disabled={loadingMore}
									className="px-4 py-2 text-sm text-rose-deep hover:text-rose border border-border hover:border-rose/50 rounded transition-colors disabled:opacity-50"
								>
									{loadingMore ? "loading..." : "load more comments"}
								</button>
							</div>
						)}
					</div>
				)}
				</section>
				</div>
			</div>
		</div>
	);
}

interface CommentWithReplies extends Comment {
	replies: CommentWithReplies[];
}

function organizeComments(comments: Comment[]): CommentWithReplies[] {
	const commentMap = new Map<Id<"comments">, CommentWithReplies>();
	const roots: CommentWithReplies[] = [];

	// First pass: create map
	for (const comment of comments) {
		commentMap.set(comment._id, { ...comment, replies: [] });
	}

	// Second pass: build tree
	for (const comment of comments) {
		const node = commentMap.get(comment._id)!;
		if (comment.parentId) {
			const parent = commentMap.get(comment.parentId);
			if (parent) {
				parent.replies.push(node);
			} else {
				roots.push(node);
			}
		} else {
			roots.push(node);
		}
	}

	// Sort by date (oldest first for replies, newest first for roots)
	const sortByDate = (a: CommentWithReplies, b: CommentWithReplies) =>
		a.createdAt - b.createdAt;
	
	function sortReplies(node: CommentWithReplies) {
		node.replies.sort(sortByDate);
		node.replies.forEach(sortReplies);
	}

	roots.sort((a, b) => b.createdAt - a.createdAt);
	roots.forEach(sortReplies);

	return roots;
}

interface CommentThreadProps {
	comment: CommentWithReplies;
	replies: CommentWithReplies[];
	currentUserId?: Id<"users">;
	isSignedIn: boolean;
	replyingTo: Id<"comments"> | null;
	setReplyingTo: (id: Id<"comments"> | null) => void;
	replyText: string;
	setReplyText: (text: string) => void;
	editingId: Id<"comments"> | null;
	setEditingId: (id: Id<"comments"> | null) => void;
	editText: string;
	setEditText: (text: string) => void;
	submitting: boolean;
	onReply: (parentId: Id<"comments">) => void;
	onEdit: (commentId: Id<"comments">) => void;
	onDelete: (commentId: Id<"comments">) => void;
	depth?: number;
}

function CommentThread({
	comment,
	replies,
	currentUserId,
	isSignedIn,
	replyingTo,
	setReplyingTo,
	replyText,
	setReplyText,
	editingId,
	setEditingId,
	editText,
	setEditText,
	submitting,
	onReply,
	onEdit,
	onDelete,
	depth = 0,
}: CommentThreadProps) {
	const isOwner = currentUserId && comment.userId === currentUserId;
	const isEditing = editingId === comment._id;
	const isReplying = replyingTo === comment._id;
	const maxDepth = 4;

	return (
		<div className={depth > 0 ? "ml-3 sm:ml-6 border-l border-border/50 pl-2 sm:pl-4" : ""}>
			<div className="p-3 sm:p-4 bg-surface border border-border rounded hover:border-border/80 transition-colors">
				<div className="flex flex-wrap items-start sm:items-center justify-between gap-1 mb-2">
					<div className="flex items-center gap-2 min-w-0">
						<span className="font-medium text-rose truncate">
							{comment.username || "anonymous"}
						</span>
						<span className="text-xs text-muted-foreground whitespace-nowrap">
							{new Date(comment.createdAt).toLocaleDateString()}
						</span>
					</div>
					{isOwner && !isEditing && (
						<div className="flex items-center gap-2 shrink-0">
							<button
								onClick={() => {
									setEditingId(comment._id);
									setEditText(comment.content);
								}}
								className="text-xs text-muted-foreground hover:text-rose transition-colors"
							>
								edit
							</button>
							<button
								onClick={() => onDelete(comment._id)}
								className="text-xs text-muted-foreground hover:text-red-400 transition-colors"
							>
								delete
							</button>
						</div>
					)}
				</div>

				{isEditing ? (
					<div className="space-y-2">
						<textarea
							value={editText}
							onChange={(e) => setEditText(e.target.value)}
							className="w-full px-3 py-2 bg-background border border-border rounded focus:outline-none focus:border-rose/50 text-sm resize-none"
							rows={2}
							disabled={submitting}
						/>
						<div className="flex gap-2">
							<button
								onClick={() => onEdit(comment._id)}
								disabled={!editText.trim() || submitting}
								className="px-3 py-1 text-xs bg-rose text-background rounded hover:bg-rose-deep transition-colors disabled:opacity-50"
							>
								save
							</button>
							<button
								onClick={() => {
									setEditingId(null);
									setEditText("");
								}}
								className="px-3 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
							>
								cancel
							</button>
						</div>
					</div>
				) : (
					<p className="text-sm whitespace-pre-wrap">{comment.content}</p>
				)}

				{/* Reply button */}
				{isSignedIn && !isEditing && depth < maxDepth && (
					<button
						onClick={() => {
							if (isReplying) {
								setReplyingTo(null);
								setReplyText("");
							} else {
								setReplyingTo(comment._id);
								setReplyText("");
							}
						}}
						className="mt-2 text-xs text-muted-foreground hover:text-rose transition-colors"
					>
						{isReplying ? "cancel reply" : "reply"}
					</button>
				)}

				{/* Reply form */}
				{isReplying && (
					<div className="mt-3 space-y-2">
						<textarea
							value={replyText}
							onChange={(e) => setReplyText(e.target.value)}
							placeholder={`replying to ${comment.username}...`}
							className="w-full px-3 py-2 bg-background border border-border rounded focus:outline-none focus:border-rose/50 text-sm resize-none"
							rows={2}
							disabled={submitting}
							autoFocus
						/>
						<button
							onClick={() => onReply(comment._id)}
							disabled={!replyText.trim() || submitting}
							className="px-3 py-1 text-xs bg-rose text-background rounded hover:bg-rose-deep transition-colors disabled:opacity-50"
						>
							{submitting ? "posting..." : "post reply"}
						</button>
					</div>
				)}
			</div>

			{/* Nested replies */}
			{replies.length > 0 && (
				<div className="mt-3 space-y-3">
					{replies.map((reply) => (
						<CommentThread
							key={reply._id}
							comment={reply}
							replies={reply.replies}
							currentUserId={currentUserId}
							isSignedIn={isSignedIn}
							replyingTo={replyingTo}
							setReplyingTo={setReplyingTo}
							replyText={replyText}
							setReplyText={setReplyText}
							editingId={editingId}
							setEditingId={setEditingId}
							editText={editText}
							setEditText={setEditText}
							submitting={submitting}
							onReply={onReply}
							onEdit={onEdit}
							onDelete={onDelete}
							depth={depth + 1}
						/>
					))}
				</div>
			)}
		</div>
	);
}
