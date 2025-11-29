"use client";

import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "../../../../convex/_generated/api";

interface BlogPost {
	id: string;
	title: string;
	link: string;
	published: string;
	content?: string;
}

export default function BlogPostPage() {
	const params = useParams();
	const postId = decodeURIComponent(params.id as string);
	const { user, isSignedIn } = useUser();

	const [post, setPost] = useState<BlogPost | null>(null);
	const [loading, setLoading] = useState(true);
	const [commentText, setCommentText] = useState("");

	const comments = useQuery(api.comments.getByPost, { postUrl: postId });
	const addComment = useMutation(api.comments.create);

	useEffect(() => {
		async function fetchPost() {
			try {
				const res = await fetch(`/api/blog/${encodeURIComponent(postId)}`);
				const data = await res.json();
				setPost(data.post);
			} catch (err) {
				console.error("Failed to fetch post:", err);
			} finally {
				setLoading(false);
			}
		}
		fetchPost();
	}, [postId]);

	const handleSubmitComment = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!commentText.trim() || !isSignedIn) return;

		try {
			await addComment({
				postUrl: postId,
				content: commentText.trim(),
			});
			setCommentText("");
		} catch (err) {
			console.error("Failed to add comment:", err);
		}
	};

	if (loading) {
		return (
			<div className="max-w-3xl mx-auto px-4 py-12">
				<div className="text-muted-foreground text-center">loading...</div>
			</div>
		);
	}

	if (!post) {
		return (
			<div className="max-w-3xl mx-auto px-4 py-12">
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
		<div className="max-w-3xl mx-auto px-4 py-12">
			<div className="space-y-8">
				<Link href="/blog" className="text-sm text-rose-deep hover:text-rose">
					&larr; back to blog
				</Link>

				<article>
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
							className="prose prose-invert prose-rose max-w-none"
							dangerouslySetInnerHTML={{ __html: post.content }}
						/>
					)}
				</article>

				{/* Comments section */}
				<section className="border-t border-border pt-8">
					<h2 className="text-xl font-semibold text-rose mb-4">
						comments ({comments?.length ?? 0})
					</h2>

					{/* Comment form */}
					{isSignedIn ? (
						<form onSubmit={handleSubmitComment} className="mb-6">
							<textarea
								value={commentText}
								onChange={(e) => setCommentText(e.target.value)}
								placeholder="leave a comment..."
								className="w-full px-4 py-3 bg-surface border border-border rounded focus:outline-none focus:border-rose/50 text-foreground placeholder:text-muted-foreground resize-none"
								rows={3}
							/>
							<button
								type="submit"
								disabled={!commentText.trim()}
								className="mt-2 px-4 py-2 bg-rose text-background rounded hover:bg-rose-deep transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
							>
								post comment
							</button>
						</form>
					) : (
						<p className="text-sm text-muted-foreground mb-6">
							sign in to leave a comment
						</p>
					)}

					{/* Comments list */}
					{!comments ? (
						<div className="text-muted-foreground text-center py-4">
							loading comments...
						</div>
					) : comments.length === 0 ? (
						<div className="text-muted-foreground text-center py-4">
							no comments yet. be the first!
						</div>
					) : (
						<div className="space-y-4">
							{comments.map((comment) => (
								<div
									key={comment._id}
									className="p-4 bg-surface border border-border rounded"
								>
									<div className="flex items-center gap-2 mb-2">
										<span className="font-medium text-rose">
											{comment.username || "anonymous"}
										</span>
										<span className="text-xs text-muted-foreground">
											{new Date(comment.createdAt).toLocaleDateString()}
										</span>
									</div>
									<p className="text-sm">{comment.content}</p>
								</div>
							))}
						</div>
					)}
				</section>
			</div>
		</div>
	);
}
