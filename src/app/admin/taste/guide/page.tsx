import Link from "next/link";
import { TASTE_CATEGORIES, TASTE_QUALITIES } from "../../../../../shared/taste";

export default function TasteGuide() {
  return (
    <article className="taste-guide">
      <Link href="/admin/taste">← collection editor</Link>
      <h1>collecting things you find beautiful</h1>
      <p>
        Collect the thing you actually noticed. It can be a whole building or
        just its staircase, a car’s instrument panel, one interaction in an
        otherwise unremarkable app, or a moment in a performance. You don’t have
        to endorse the whole thing.
      </p>
      <h2>adding an entry</h2>
      <ul>
        <li>
          Give it a specific title. Add an optional one-line observation for the
          index.
        </li>
        <li>
          Choose “a particular detail” when relevant, and name the larger thing
          in context.
        </li>
        <li>
          Upload media or paste file URLs. Choose one cover and arrange the rest
          in the order you want someone to explore.
        </li>
        <li>
          Add a source and credits when useful. They are separate from the
          entry’s own link.
        </li>
        <li>
          Use categories for what it is, and qualities for what you notice. A
          few precise choices are better than tagging every possible
          association.
        </li>
        <li>
          Preview the entry. New entries start as drafts; check “publish this
          entry” when ready.
        </li>
        <li>
          Reorder the unfiltered collection with the drag handles (keyboard
          works too). Give a few entries more room when their material benefits
          from it.
        </li>
      </ul>
      <h2>category prompts</h2>
      <div className="taste-guide-grid">
        {TASTE_CATEGORIES.map((category) => (
          <section key={category.id}>
            <h3>{category.label}</h3>
            <p>{category.examples}</p>
          </section>
        ))}
      </div>
      <h2>qualities to notice</h2>
      <p>{TASTE_QUALITIES.join(" · ")}</p>
      <p>
        These are suggestions, not a required vocabulary. Qualities connect
        otherwise unrelated things: restraint can describe a watch, a website,
        and a building.
      </p>
      <h2>choosing media</h2>
      <ul>
        <li>
          <strong>Images:</strong> a strong full view, a tight crop of the
          detail, and context when useful. Uploaded dimensions are read
          automatically; enter dimensions for external images to reserve their
          shape.
        </li>
        <li>
          <strong>Video:</strong> browser-playable MP4 or WebM. Uploading
          extracts a still poster. Hover/focus previews are muted and brief;
          full recordings have native controls. Use start/end seconds to point
          to a moment.
        </li>
        <li>
          <strong>Audio:</strong> MP3, WAV, or another browser-supported format.
          Add cover art if it helps. Audio only plays when the visitor chooses
          to play it.
        </li>
        <li>
          <strong>Interactive examples:</strong> a URL, preferably with a still
          poster. Visitors explicitly load the embed. YouTube, Vimeo, CodePen,
          ShaderToy and known embed providers get adapted URLs; other HTTPS
          examples run in a restricted frame and may need the “open original”
          link.
        </li>
        <li>
          <strong>Text:</strong> Markdown for passages and explanations, code
          for exact formatting, or TeX math for an equation. Math uses KaTeX
          with HTML/resource commands disabled.
        </li>
        <li>
          <strong>Animated images:</strong> mark external GIF/APNG/animated WebP
          files as animated and supply a still poster. Uploaded GIFs get a still
          automatically. Short video usually offers better playback control.
        </li>
      </ul>
      <h2>a few useful habits</h2>
      <p>
        Show what makes an entry worth looking at before explaining it. You can
        leave descriptions empty. Put a per-image observation in its caption,
        rather than burying every detail in one long paragraph. Use a source
        link for the original work, and media credits for the individual
        photographer or recording.
      </p>
      <p>
        Uploads are limited to 100 MB each and an entry can contain up to 24
        media items. Removing an attachment or an entry does not delete
        potentially shared stored files. Existing entries retain their old
        screenshots and notes until you edit them.
      </p>
      <p>
        The reference guide is also in <code>docs/taste-collection.md</code>.
      </p>
    </article>
  );
}
