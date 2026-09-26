import Image from "next/image";
import { IntentLink as Link } from "@/components/intent-link";

export default function HomePage() {
  return (
    <div className="home-page">
      <Image
        src="/terrace.webp"
        width={1536}
        height={1024}
        preload
        sizes="(max-width: 600px) 100vw, (max-width: 1200px) calc(100vw - 64px), 1120px"
        className="home-painting"
        alt="A shaded terrace above a canal-side neighbourhood, with workshops, gardens, a sleeping cat, and solar-covered hills across the harbour."
      />
      <section className="home-intro">
        <h1>hi, i’m shresht.</h1>
        <p>
          i’m shresht bhowmick, also known as tetraslam. i build software and
          robots, work on machine intelligence, and imagine worlds.
        </p>
        <p>
          currently, i’m a member of technical staff at a stealth neolab.
          previously, <a href="https://natural.co">natural</a>, the mit media
          lab, and mosaic.
        </p>
        <p>
          this is where i keep <Link href="/work">my work</Link>,{" "}
          <Link href="/blog">my writing</Link>, and{" "}
          <Link href="/taste">things i find beautiful</Link>. you can also meet{" "}
          <Link href="/friends">my friends</Link> or wander through{" "}
          <Link href="/travel">places i’ve been</Link>.
        </p>
        <nav aria-label="Contact" className="home-contact">
          <a href="https://x.com/tetraslam">twitter</a>
          <a href="https://github.com/tetraslam">github</a>
          <a href="mailto:bhowmickshresht@gmail.com">email</a>
        </nav>
      </section>
    </div>
  );
}
