"use client";

import ReactMarkdown from "react-markdown";

interface MarkdownProps {
	content: string;
	className?: string;
}

export function Markdown({ content, className = "" }: MarkdownProps) {
	return (
		<div className={`prose prose-sm prose-invert max-w-none ${className}`}>
			<ReactMarkdown
				components={{
					// Style headings
					h1: ({ children }) => (
						<h1 className="text-xl font-bold text-rose mt-4 mb-2">{children}</h1>
					),
					h2: ({ children }) => (
						<h2 className="text-lg font-semibold text-rose mt-3 mb-2">
							{children}
						</h2>
					),
					h3: ({ children }) => (
						<h3 className="text-base font-semibold text-rose mt-2 mb-1">
							{children}
						</h3>
					),
					// Style paragraphs
					p: ({ children }) => (
						<p className="text-foreground/90 mb-2 leading-relaxed">{children}</p>
					),
					// Style links
					a: ({ href, children }) => (
						<a
							href={href}
							target="_blank"
							rel="noopener noreferrer"
							className="text-rose-deep hover:text-rose underline underline-offset-2 transition-colors"
						>
							{children}
						</a>
					),
					// Style lists
					ul: ({ children }) => (
						<ul className="list-disc list-inside mb-2 space-y-1 text-foreground/90">
							{children}
						</ul>
					),
					ol: ({ children }) => (
						<ol className="list-decimal list-inside mb-2 space-y-1 text-foreground/90">
							{children}
						</ol>
					),
					li: ({ children }) => (
						<li className="text-foreground/90">{children}</li>
					),
					// Style code
					code: ({ children, className }) => {
						const isInline = !className;
						if (isInline) {
							return (
								<code className="px-1.5 py-0.5 bg-background rounded text-rose text-sm font-mono">
									{children}
								</code>
							);
						}
						return (
							<code className="block p-3 bg-background rounded text-sm font-mono overflow-x-auto">
								{children}
							</code>
						);
					},
					pre: ({ children }) => (
						<pre className="bg-background rounded p-3 overflow-x-auto mb-2">
							{children}
						</pre>
					),
					// Style blockquotes
					blockquote: ({ children }) => (
						<blockquote className="border-l-2 border-rose/50 pl-3 italic text-muted-foreground my-2">
							{children}
						</blockquote>
					),
					// Style horizontal rules
					hr: () => <hr className="border-border my-4" />,
					// Style emphasis
					strong: ({ children }) => (
						<strong className="font-semibold text-foreground">{children}</strong>
					),
					em: ({ children }) => (
						<em className="italic text-foreground/80">{children}</em>
					),
				}}
			>
				{content}
			</ReactMarkdown>
		</div>
	);
}
