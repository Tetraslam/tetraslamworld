"use client";
import DragHandle from "@tiptap/extension-drag-handle-react";
import Placeholder from "@tiptap/extension-placeholder";
import {
  EditorContent,
  type NodeViewProps,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  useEditor,
} from "@tiptap/react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { getUploads, saveUpload, type UploadRecord } from "@/lib/writing/local";
import { processUpload } from "@/lib/writing/upload-client";
import { decodeBlock, type WritingBlock } from "../../../shared/writing";
import {
  WritingBlockNode,
  writingExtensions,
} from "../../../shared/writing-extensions";
import { WritingBlockView } from "./prose";

type EditBlock = { position: number | null; raw: string; nodeType?: string };
const BlockContext = createContext<(value: EditBlock) => void>(() => {});
function BlockNode({ node, getPos, selected }: NodeViewProps) {
  const edit = useContext(BlockContext);
  const block = decodeBlock(node.attrs.raw);
  return (
    <NodeViewWrapper
      className={`writing-node ${selected ? "selected" : ""}`}
      contentEditable={false}
    >
      <div className="writing-node-actions">
        <span role="img" data-drag-handle draggable aria-label="Drag block">
          ⠿
        </span>
        <button
          type="button"
          onClick={() =>
            edit({ position: getPos() ?? null, raw: node.attrs.raw })
          }
        >
          edit {block?.type || "block"}
        </button>
      </div>
      {block?.type === "upload" ? (
        <p className="writing-upload-placeholder">
          {String(block.filename || "media")} · upload pending
        </p>
      ) : (
        <WritingBlockView raw={node.attrs.raw} />
      )}
    </NodeViewWrapper>
  );
}

export function WritingEditor({
  body,
  onChange,
  owner,
  postId,
  locked = false,
  onUploadStatus,
}: {
  body: string;
  onChange: (body: string) => void;
  owner: string;
  postId: string;
  locked?: boolean;
  onUploadStatus: (message: string) => void;
}) {
  const [editing, setEditing] = useState<EditBlock | null>(null),
    [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null),
    callbacks = useRef({ onChange, onUploadStatus });
  callbacks.current = { onChange, onUploadStatus };
  const editor = useEditor(
    {
      extensions: [
        ...writingExtensions(
          WritingBlockNode.extend({
            addNodeView() {
              return ReactNodeViewRenderer(BlockNode);
            },
          }),
          (latex, position, inline) =>
            setEditing({
              position,
              raw: JSON.stringify({
                type: inline ? "inline-math" : "math",
                latex,
              }),
              nodeType: inline ? "inlineMath" : "blockMath",
            }),
        ),
        Placeholder.configure({ placeholder: "Start with a thought…" }),
      ],
      content: body,
      contentType: "markdown",
      immediatelyRender: false,
      shouldRerenderOnTransaction: true,
      editable: !locked,
      onUpdate: ({ editor }) =>
        callbacks.current.onChange(editor.getMarkdown()),
      editorProps: {
        attributes: {
          class: "writing-document",
          role: "textbox",
          "aria-label": "Post body",
          "aria-multiline": "true",
        },
        handlePaste: (_view, event) => {
          const files = Array.from(event.clipboardData?.files || []);
          if (!files.length) return false;
          void addFiles(files);
          return true;
        },
        handleDrop: (_view, event, _slice, moved) => {
          const files = Array.from(event.dataTransfer?.files || []);
          if (moved || !files.length) return false;
          event.preventDefault();
          void addFiles(files);
          return true;
        },
      },
    },
    [postId],
  );
  useEffect(() => {
    editor?.setEditable(!locked, false);
  }, [editor, locked]);
  useEffect(() => {
    if (editor && body !== editor.getMarkdown())
      editor.commands.setContent(body, {
        contentType: "markdown",
        emitUpdate: false,
      });
  }, [editor, body]);
  const finishUpload = useCallback(
    async (record: UploadRecord) => {
      if (!editor) return;
      try {
        const block = await processUpload(record, (message) =>
          callbacks.current.onUploadStatus(`${record.name}: ${message}`),
        );
        if (editor.isDestroyed) return;
        const tr = editor.state.tr;
        editor.state.doc.descendants((node, pos) => {
          if (
            node.type.name === "writingBlock" &&
            decodeBlock(node.attrs.raw)?.uploadId === record.id
          )
            tr.setNodeMarkup(pos, undefined, {
              raw: JSON.stringify(block, null, 2),
            });
        });
        if (tr.docChanged) editor.view.dispatch(tr);
        callbacks.current.onUploadStatus("");
      } catch (error) {
        callbacks.current.onUploadStatus(
          error instanceof Error
            ? error.message
            : "Upload paused. Retry when connected.",
        );
      }
    },
    [editor],
  );
  useEffect(() => {
    if (!editor) return;
    const resume = async () => {
      const records = await getUploads(owner, postId);
      for (const record of records) {
        let referenced = false;
        editor.state.doc.descendants((node) => {
          if (
            node.type.name === "writingBlock" &&
            decodeBlock(node.attrs.raw)?.uploadId === record.id
          )
            referenced = true;
        });
        if (referenced) await finishUpload(record);
      }
    };
    void resume().catch(() => {});
    window.addEventListener("online", resume);
    return () => window.removeEventListener("online", resume);
  }, [editor, owner, postId, finishUpload]);
  async function addFiles(files: File[]) {
    if (!editor || locked) return;
    for (const file of files) {
      if (!/^(image|video|audio)\//.test(file.type)) {
        setError("Choose an image, video, or audio file.");
        continue;
      }
      const record: UploadRecord = {
        id: crypto.randomUUID(),
        owner,
        postId,
        name: file.name,
        file,
        createdAt: Date.now(),
        phase: "pending",
      };
      try {
        await saveUpload(record);
        editor
          .chain()
          .focus()
          .insertContent({
            type: "writingBlock",
            attrs: {
              raw: JSON.stringify({
                type: "upload",
                uploadId: record.id,
                filename: file.name,
              }),
            },
          })
          .run();
        await finishUpload(record);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Couldn’t retain this upload locally.",
        );
      }
    }
  }
  if (!editor) return <p className="writing-muted">opening your document…</p>;
  const insert = (type: string) =>
    setEditing({
      position: null,
      raw: JSON.stringify(
        type === "interactive"
          ? {
              type,
              name: "station-spacing",
              version: 1,
              spacing: 1,
              distance: 10,
              speed: 60,
              dwell: 30,
              fallback: "",
            }
          : { type },
        null,
        2,
      ),
    });
  function apply(raw: string) {
    if (!editor || !editing || locked) return;
    const data = decodeBlock(raw);
    if (!data) {
      setError("The block must contain valid JSON with a type.");
      return;
    }
    if (data.type === "math" || data.type === "inline-math") {
      const latex = String(data.latex || "");
      if (editing.position !== null) {
        const node = editor.state.doc.nodeAt(editing.position);
        if (node?.type.name !== editing.nodeType) {
          setError("This equation moved; reopen it before editing.");
          return;
        }
        if (data.type === "math")
          editor.commands.updateBlockMath({ pos: editing.position, latex });
        else editor.commands.updateInlineMath({ pos: editing.position, latex });
      } else if (data.type === "math")
        editor.chain().focus().insertBlockMath({ latex }).run();
      else editor.chain().focus().insertInlineMath({ latex }).run();
    } else if (data.type === "link") {
      const url = String(data.href || "");
      if (!/^(https?:\/\/|mailto:|\/(?!\/)|#)/.test(url)) {
        setError("Use a web, email, or site-relative link.");
        return;
      }
      if (editor.state.selection.empty)
        editor
          .chain()
          .focus()
          .insertContent({
            type: "text",
            text: url,
            marks: [{ type: "link", attrs: { href: url } }],
          })
          .run();
      else
        editor
          .chain()
          .focus()
          .extendMarkRange("link")
          .setLink({ href: url })
          .run();
    } else if (data.type === "footnote") {
      const used = new Set<string>();
      editor.state.doc.descendants((node) => {
        if (node.type.name === "footnoteDefinition") used.add(node.attrs.id);
      });
      let id = 1;
      while (used.has(String(id))) id++;
      editor
        .chain()
        .focus()
        .insertContent({ type: "footnoteReference", attrs: { id: String(id) } })
        .command(({ tr, state }) => {
          tr.insert(
            tr.doc.content.size,
            state.schema.nodes.footnoteDefinition.create(
              { id: String(id) },
              state.schema.text(String(data.text || "note")),
            ),
          );
          return true;
        })
        .run();
    } else if (editing.position === null)
      editor
        .chain()
        .focus()
        .insertContent({ type: "writingBlock", attrs: { raw } })
        .run();
    else if (editing.nodeType === "image") {
      const node = editor.state.doc.nodeAt(editing.position);
      if (node?.type.name !== "image") {
        setError("This image moved; reopen it before editing.");
        return;
      }
      editor
        .chain()
        .focus()
        .command(({ tr, state }) => {
          tr.replaceWith(
            editing.position!,
            editing.position! + node.nodeSize,
            state.schema.nodes.writingBlock.create({ raw }),
          );
          return true;
        })
        .run();
    } else {
      const node = editor.state.doc.nodeAt(editing.position);
      if (
        node?.type.name !== "writingBlock" ||
        node.attrs.raw !== editing.raw
      ) {
        setError(
          "The block moved or changed. Close this panel and reopen it to edit the latest version.",
        );
        return;
      }
      editor
        .chain()
        .focus()
        .command(({ tr }) => {
          tr.setNodeMarkup(editing.position!, undefined, { raw });
          return true;
        })
        .run();
    }
    setEditing(null);
    setError("");
  }
  return (
    <BlockContext.Provider value={setEditing}>
      <fieldset
        disabled={locked}
        className="writing-toolbar"
        aria-label="Formatting"
      >
        <button
          type="button"
          aria-pressed={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Bold (Ctrl/⌘ B)"
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          aria-pressed={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italic (Ctrl/⌘ I)"
        >
          <em>I</em>
        </button>
        <select
          aria-label="Paragraph style"
          value={
            editor.isActive("heading", { level: 2 })
              ? "h2"
              : editor.isActive("heading", { level: 3 })
                ? "h3"
                : editor.isActive("blockquote")
                  ? "quote"
                  : editor.isActive("codeBlock")
                    ? "code"
                    : "p"
          }
          onChange={(e) => {
            const value = e.target.value;
            const chain = editor.chain().focus();
            if (value === "h2" || value === "h3")
              chain.toggleHeading({ level: value === "h2" ? 2 : 3 }).run();
            else if (value === "quote") chain.toggleBlockquote().run();
            else if (value === "code") chain.toggleCodeBlock().run();
            else {
              if (editor.isActive("blockquote")) chain.toggleBlockquote();
              chain.setParagraph().run();
            }
          }}
        >
          <option value="p">paragraph</option>
          <option value="h2">heading</option>
          <option value="h3">subheading</option>
          <option value="quote">quote</option>
          <option value="code">code</option>
        </select>
        {editor.isActive("codeBlock") && (
          <input
            aria-label="Code language"
            placeholder="language"
            className="writing-code-language"
            value={editor.getAttributes("codeBlock").language || ""}
            onChange={(e) =>
              editor.commands.updateAttributes("codeBlock", {
                language: e.target.value || null,
              })
            }
          />
        )}
        {editor.isActive("image") && (
          <button
            type="button"
            onClick={() => {
              const attrs = editor.getAttributes("image");
              setEditing({
                position: editor.state.selection.from,
                nodeType: "image",
                raw: JSON.stringify({
                  ...attrs,
                  type: "image",
                  src: attrs.src,
                  alt: attrs.alt || "",
                  caption: attrs.title || "",
                }),
              });
            }}
          >
            image details
          </button>
        )}
        <button
          type="button"
          aria-pressed={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          list
        </button>
        <button
          type="button"
          aria-pressed={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          1. list
        </button>
        <button type="button" onClick={() => insert("link")}>
          link
        </button>
        <select
          aria-label="Insert a block"
          value=""
          onChange={(e) => {
            const value = e.target.value;
            if (value === "media") input.current?.click();
            else if (value === "table")
              editor
                .chain()
                .focus()
                .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                .run();
            else if (value === "math" || value === "inline-math") insert(value);
            else if (value === "task")
              editor.chain().focus().toggleTaskList().run();
            else if (value) insert(value);
          }}
        >
          <option value="">insert…</option>
          <option value="media">image / video / audio</option>
          <option value="gallery">gallery</option>
          <option value="table">table</option>
          <option value="math">equation</option>
          <option value="inline-math">inline equation</option>
          <option value="footnote">footnote</option>
          <option value="reference">site reference</option>
          <option value="interactive">interactive visualization</option>
          <option value="task">checklist</option>
        </select>
        {editor.isActive("table") && (
          <>
            <button
              type="button"
              onClick={() => editor.chain().focus().addRowAfter().run()}
            >
              + row
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().addColumnAfter().run()}
            >
              + column
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().deleteTable().run()}
            >
              remove table
            </button>
          </>
        )}
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
        >
          undo
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
        >
          redo
        </button>
        <input
          ref={input}
          type="file"
          accept="image/*,video/*,audio/*"
          multiple
          className="sr-only"
          aria-label="Upload media"
          onChange={(e) => {
            void addFiles(Array.from(e.target.files || []));
            e.target.value = "";
          }}
        />
      </fieldset>
      {error && !editing && (
        <p role="alert" className="writing-notice">
          {error}
        </p>
      )}
      <DragHandle editor={editor}>
        <span
          role="img"
          className="writing-drag-handle"
          aria-label="Drag to move this block"
        >
          ⠿
        </span>
      </DragHandle>
      <EditorContent editor={editor} />
      <Dialog
        open={!!editing}
        onOpenChange={(open) => {
          if (!open) {
            setEditing(null);
            setError("");
          }
        }}
      >
        <DialogContent
          className="writing-block-dialog"
          aria-describedby={undefined}
        >
          <DialogTitle>
            {editing?.position === null ? "insert" : "edit"} block
          </DialogTitle>
          {editing && <BlockForm initial={editing.raw} onApply={apply} />}
          {error && <p role="alert">{error}</p>}
        </DialogContent>
      </Dialog>
    </BlockContext.Provider>
  );
}

function BlockForm({
  initial,
  onApply,
}: {
  initial: string;
  onApply: (raw: string) => void;
}) {
  const formId = useId();
  const [block, setBlock] = useState<WritingBlock>(
      () => decodeBlock(initial) || { type: "unknown" },
    ),
    [raw, setRaw] = useState(initial);
  const [references, setReferences] = useState<
      Array<{ label: string; href: string }>
    >([]),
    [assets, setAssets] = useState<
      Array<{ id: string; filename: string; contentType: string }>
    >([]);
  useEffect(() => {
    if (block.type === "reference")
      void fetch("/api/writing/references")
        .then((r) => r.json())
        .then((r) => setReferences(r.items || []));
    if (block.type === "gallery")
      void fetch("/api/writing/assets")
        .then((r) => r.json())
        .then((r) => setAssets(r.assets || []));
  }, [block.type]);
  const field = (name: string, label: string, multiline = false) => (
    <label key={name} htmlFor={`${formId}-${name}`}>
      {label}
      {multiline ? (
        <textarea
          id={`${formId}-${name}`}
          rows={4}
          value={String(block[name] ?? "")}
          onChange={(e) => setBlock({ ...block, [name]: e.target.value })}
        />
      ) : (
        <input
          id={`${formId}-${name}`}
          value={String(block[name] ?? "")}
          onChange={(e) => setBlock({ ...block, [name]: e.target.value })}
        />
      )}
    </label>
  );
  const known = [
    "image",
    "video",
    "audio",
    "gallery",
    "reference",
    "interactive",
    "footnote",
    "link",
    "math",
    "inline-math",
  ].includes(block.type);
  return (
    <form
      className="writing-block-form"
      onSubmit={(e) => {
        e.preventDefault();
        onApply(known ? JSON.stringify(block, null, 2) : raw);
      }}
    >
      {["image", "video", "audio"].includes(block.type) && (
        <>
          {field("src", "media URL")}
          {field("alt", "description / alt text")}
          {block.type !== "image" && field("poster", "poster URL")}
          {block.type !== "image" && field("transcript", "transcript", true)}
        </>
      )}
      {block.type === "gallery" && (
        <>
          <p>choose uploaded images</p>
          <div className="writing-asset-choices">
            {assets
              .filter((a) => a.contentType.startsWith("image/"))
              .map((asset) => {
                const items = Array.isArray(block.items) ? block.items : [];
                return (
                  <label key={asset.id}>
                    <input
                      type="checkbox"
                      checked={items.some(
                        (item) => item.src === `writing-asset:${asset.id}`,
                      )}
                      onChange={(e) =>
                        setBlock({
                          ...block,
                          items: e.target.checked
                            ? [
                                ...items,
                                {
                                  id: asset.id,
                                  src: `writing-asset:${asset.id}`,
                                  alt: "",
                                  caption: "",
                                },
                              ]
                            : items.filter((item) => item.id !== asset.id),
                        })
                      }
                    />
                    {asset.filename}
                  </label>
                );
              })}
          </div>
          {Array.isArray(block.items) &&
            block.items.map((item, index) => (
              <div key={item.id || index} className="writing-gallery-item">
                <label>
                  image {index + 1} description
                  <input
                    value={item.alt || ""}
                    onChange={(e) =>
                      setBlock({
                        ...block,
                        items: (block.items as Record<string, unknown>[]).map(
                          (v, i) =>
                            i === index ? { ...v, alt: e.target.value } : v,
                        ),
                      })
                    }
                  />
                </label>
                <label>
                  caption
                  <input
                    value={item.caption || ""}
                    onChange={(e) =>
                      setBlock({
                        ...block,
                        items: (block.items as Record<string, unknown>[]).map(
                          (v, i) =>
                            i === index ? { ...v, caption: e.target.value } : v,
                        ),
                      })
                    }
                  />
                </label>
                <button
                  type="button"
                  disabled={!index}
                  onClick={() => {
                    const items = [
                      ...(block.items as Record<string, unknown>[]),
                    ];
                    [items[index - 1], items[index]] = [
                      items[index],
                      items[index - 1],
                    ];
                    setBlock({ ...block, items });
                  }}
                >
                  move up
                </button>
              </div>
            ))}
        </>
      )}
      {block.type === "reference" && (
        <>
          <label>
            from your site
            <select
              value={String(block.href || "")}
              onChange={(e) => {
                const item = references.find((r) => r.href === e.target.value);
                if (item) setBlock({ ...block, ...item });
              }}
            >
              <option value="">choose an entry…</option>
              {references.map((item) => (
                <option key={item.href} value={item.href}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          {field("href", "address")}
          {field("label", "link text")}
          {field("description", "context", true)}
        </>
      )}
      {block.type === "interactive" && (
        <>
          <p>station spacing · version 1</p>
          {["spacing", "distance", "speed", "dwell"].map((name) => (
            <label key={name}>
              {name}
              <input
                type="number"
                step="any"
                value={Number(block[name] ?? 1)}
                onChange={(e) =>
                  setBlock({ ...block, [name]: Number(e.target.value) })
                }
              />
            </label>
          ))}
          {field("fallback", "text alternative for feeds and exports", true)}
        </>
      )}
      {block.type === "footnote" && field("text", "footnote", true)}
      {block.type === "link" && field("href", "link address")}
      {!["link", "footnote", "math", "inline-math"].includes(block.type) &&
        known && (
          <>
            {field("caption", "caption", true)}
            {field("credit", "credit")}
            {field("creditUrl", "credit link")}
          </>
        )}
      {(block.type === "math" || block.type === "inline-math") &&
        field("latex", "equation (TeX)", true)}
      {!known && (
        <>
          <p>
            This block is preserved exactly. Its source is available here for
            advanced editing.
          </p>
          <textarea
            aria-label="Block source"
            rows={12}
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
          />
        </>
      )}
      <button type="submit" className="writing-primary">
        apply
      </button>
    </form>
  );
}
