"use client";

import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

interface LinkForm {
	title: string;
	url: string;
	content: string;
	tags: string;
	pinned: boolean;
}

const emptyForm: LinkForm = {
	title: "",
	url: "",
	content: "",
	tags: "",
	pinned: false,
};

export default function AdminLinksPage() {
	const links = useQuery(api.links.list);
	const create = useMutation(api.links.create);
	const update = useMutation(api.links.update);
	const remove = useMutation(api.links.remove);

	const [editing, setEditing] = useState<Id<"links"> | "new" | null>(null);
	const [form, setForm] = useState<LinkForm>(emptyForm);

	const handleEdit = (item: NonNullable<typeof links>[0]) => {
		setEditing(item._id);
		setForm({
			title: item.title,
			url: item.url,
			content: item.content || "",
			tags: item.tags?.join(", ") || "",
			pinned: item.pinned || false,
		});
	};

	const handleNew = () => {
		setEditing("new");
		setForm(emptyForm);
	};

	const handleCancel = () => {
		setEditing(null);
		setForm(emptyForm);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const data = {
			title: form.title,
			url: form.url,
			content: form.content || undefined,
			tags: form.tags ? form.tags.split(",").map((t) => t.trim()) : undefined,
			pinned: form.pinned,
		};

		if (editing === "new") {
			await create(data);
		} else if (editing) {
			await update({ id: editing, ...data });
		}
		handleCancel();
	};

	const handleDelete = async (id: Id<"links">) => {
		if (confirm("Delete this link?")) {
			await remove({ id });
		}
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-bold">links</h1>
				<button
					onClick={handleNew}
					className="px-4 py-2 bg-rose text-background rounded hover:bg-rose-deep transition-colors"
				>
					+ add link
				</button>
			</div>

			{editing && (
				<form
					onSubmit={handleSubmit}
					className="p-4 bg-surface border border-border rounded space-y-4"
				>
					<div>
						<label className="block text-sm text-muted-foreground mb-1">
							title *
						</label>
						<input
							type="text"
							value={form.title}
							onChange={(e) => setForm({ ...form, title: e.target.value })}
							required
							className="w-full px-3 py-2 bg-background border border-border rounded focus:outline-none focus:border-rose/50"
						/>
					</div>

					<div>
						<label className="block text-sm text-muted-foreground mb-1">
							url *
						</label>
						<input
							type="url"
							value={form.url}
							onChange={(e) => setForm({ ...form, url: e.target.value })}
							required
							className="w-full px-3 py-2 bg-background border border-border rounded focus:outline-none focus:border-rose/50"
						/>
					</div>

					<div>
						<label className="block text-sm text-muted-foreground mb-1">
							description
						</label>
						<textarea
							value={form.content}
							onChange={(e) => setForm({ ...form, content: e.target.value })}
							rows={2}
							className="w-full px-3 py-2 bg-background border border-border rounded focus:outline-none focus:border-rose/50 resize-none"
						/>
					</div>

					<div>
						<label className="block text-sm text-muted-foreground mb-1">
							tags (comma separated)
						</label>
						<input
							type="text"
							value={form.tags}
							onChange={(e) => setForm({ ...form, tags: e.target.value })}
							placeholder="e.g., tool, article, reference"
							className="w-full px-3 py-2 bg-background border border-border rounded focus:outline-none focus:border-rose/50"
						/>
					</div>

					<label className="flex items-center gap-2">
						<input
							type="checkbox"
							checked={form.pinned}
							onChange={(e) => setForm({ ...form, pinned: e.target.checked })}
							className="rounded border-border"
						/>
						<span className="text-sm">pinned</span>
					</label>

					<div className="flex gap-2">
						<button
							type="submit"
							className="px-4 py-2 bg-rose text-background rounded hover:bg-rose-deep transition-colors"
						>
							{editing === "new" ? "create" : "save"}
						</button>
						<button
							type="button"
							onClick={handleCancel}
							className="px-4 py-2 border border-border rounded hover:border-rose/50 transition-colors"
						>
							cancel
						</button>
					</div>
				</form>
			)}

			{!links ? (
				<p className="text-muted-foreground">loading...</p>
			) : links.length === 0 ? (
				<p className="text-muted-foreground">no links saved yet</p>
			) : (
				<div className="space-y-2">
					{links
						.sort((a, b) => b.createdAt - a.createdAt)
						.map((item) => (
							<div
								key={item._id}
								className="flex items-center justify-between p-3 bg-surface border border-border rounded"
							>
								<div>
									<span className="font-medium">{item.title}</span>
									{item.pinned && (
										<span className="ml-2 text-xs text-rose">pinned</span>
									)}
									<p className="text-xs text-muted-foreground truncate max-w-md">
										{item.url}
									</p>
								</div>
								<div className="flex gap-2">
									<button
										onClick={() => handleEdit(item)}
										className="text-sm text-rose-deep hover:text-rose"
									>
										edit
									</button>
									<button
										onClick={() => handleDelete(item._id)}
										className="text-sm text-muted-foreground hover:text-rose-deep"
									>
										delete
									</button>
								</div>
							</div>
						))}
				</div>
			)}
		</div>
	);
}
