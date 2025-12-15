"use client";

import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

export default function AdminEmailsPage() {
	const emails = useQuery(api.emailList.list, {});
	const addEmails = useMutation(api.emailList.add);
	const removeEmail = useMutation(api.emailList.remove);
	const clearAll = useMutation(api.emailList.clear);

	const [input, setInput] = useState("");
	const [adding, setAdding] = useState(false);
	const [lastResult, setLastResult] = useState<{ added: number; skipped: number } | null>(null);
	const [copied, setCopied] = useState(false);

	const handleAdd = async () => {
		if (!input.trim()) return;

		setAdding(true);
		setLastResult(null);

		try {
			// Split by comma or newline, filter empty
			const emailList = input
				.split(/[,\n]/)
				.map((e) => e.trim())
				.filter((e) => e.length > 0);

			const result = await addEmails({ emails: emailList });
			setLastResult({ added: result.added.length, skipped: result.skipped.length });
			setInput("");
		} finally {
			setAdding(false);
		}
	};

	const handleCopy = async () => {
		if (!emails || emails.length === 0) return;

		const emailString = emails.map((e) => e.email).join(", ");
		await navigator.clipboard.writeText(emailString);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	const handleDownloadCSV = () => {
		if (!emails || emails.length === 0) return;

		const csvContent = "email,added_at\n" + emails
			.map((e) => `${e.email},${new Date(e.addedAt).toISOString()}`)
			.join("\n");

		const blob = new Blob([csvContent], { type: "text/csv" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `email-list-${new Date().toISOString().split("T")[0]}.csv`;
		a.click();
		URL.revokeObjectURL(url);
	};

	const handleClear = async () => {
		if (!confirm("Are you sure you want to delete ALL emails? This cannot be undone.")) return;
		await clearAll({});
	};

	const handleDelete = async (id: Id<"emailList">) => {
		await removeEmail({ id });
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">email list</h1>
					<p className="text-sm text-muted-foreground mt-1">
						{emails?.length ?? 0} email{emails?.length !== 1 ? "s" : ""} in list
					</p>
				</div>
			</div>

			{/* Add emails form */}
			<div className="p-4 bg-surface border border-border rounded space-y-3">
				<label className="block text-sm text-muted-foreground">
					paste emails (comma or newline separated)
				</label>
				<textarea
					value={input}
					onChange={(e) => setInput(e.target.value)}
					placeholder="email1@example.com, email2@example.com&#10;email3@example.com"
					rows={4}
					className="w-full px-3 py-2 bg-background border border-border rounded focus:outline-none focus:border-rose/50 resize-none font-mono text-sm"
				/>
				<div className="flex items-center gap-3">
					<button
						type="button"
						onClick={handleAdd}
						disabled={adding || !input.trim()}
						className="px-4 py-2 bg-rose text-background rounded hover:bg-rose-deep transition-colors disabled:opacity-50"
					>
						{adding ? "adding..." : "add emails"}
					</button>
					{lastResult && (
						<span className="text-sm text-muted-foreground">
							added {lastResult.added}, skipped {lastResult.skipped} duplicates
						</span>
					)}
				</div>
			</div>

			{/* Actions */}
			{emails && emails.length > 0 && (
				<div className="flex flex-wrap gap-2">
					<button
						type="button"
						onClick={handleCopy}
						className="px-3 py-1.5 text-sm border border-border rounded hover:border-rose/50 transition-colors"
					>
						{copied ? "copied!" : "copy all for bcc"}
					</button>
					<button
						type="button"
						onClick={handleDownloadCSV}
						className="px-3 py-1.5 text-sm border border-border rounded hover:border-rose/50 transition-colors"
					>
						download csv
					</button>
					<button
						type="button"
						onClick={handleClear}
						className="px-3 py-1.5 text-sm border border-red-500/30 text-red-400 rounded hover:border-red-500/50 hover:bg-red-500/10 transition-colors"
					>
						clear all
					</button>
				</div>
			)}

			{/* Email list */}
			{!emails ? (
				<p className="text-muted-foreground">loading...</p>
			) : emails.length === 0 ? (
				<p className="text-muted-foreground">no emails in list yet</p>
			) : (
				<div className="space-y-1">
					{emails.map((email) => (
						<div
							key={email._id}
							className="flex items-center justify-between p-2 bg-surface border border-border rounded group hover:border-border/80"
						>
							<div className="flex items-center gap-3 min-w-0">
								<span className="font-mono text-sm truncate">{email.email}</span>
								<span className="text-xs text-muted-foreground shrink-0">
									{new Date(email.addedAt).toLocaleDateString()}
								</span>
							</div>
							<button
								type="button"
								onClick={() => handleDelete(email._id)}
								className="text-sm text-muted-foreground hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
							>
								remove
							</button>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
