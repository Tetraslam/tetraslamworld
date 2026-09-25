import type { Metadata } from "next";
import { TerraceScene } from "./scene";
import styles from "./terrace.module.css";

export const metadata: Metadata = {
  title: "A day in tetraslam’s world",
  description:
    "A view from the terrace. An illustrated world by Shresht Bhowmick.",
  robots: { index: false, follow: true },
};

export default function TerracePage() {
  return (
    <div className={styles.page}>
      <header className={styles.masthead}>
        <a href="/terrace" className={styles.wordmark}>
          tetraslam’s world
        </a>
        <span>a view from the terrace</span>
      </header>
      <figure className={styles.figure}>
        <TerraceScene />
        <figcaption className={styles.caption}>
          <span>a little further into the future.</span>
          <span>study no. 02</span>
        </figcaption>
      </figure>
      <section className={styles.introduction} aria-label="About Shresht">
        <h1>hi, i’m shresht.</h1>
        <p>i build things, and imagine worlds.</p>
        <details className={styles.about} id="about">
          <summary>
            a little about me <span aria-hidden="true">↗</span>
          </summary>
          <div className={styles.biography}>
            <p>
              i’m shresht bhowmick, also known as tetraslam. i work on machine
              intelligence, build software and robots, and spend some of my time
              worldbuilding.
            </p>
            <p>
              currently, i’m a member of technical staff at a stealth neolab.
              previously, i worked at <a href="https://natural.co">natural</a>,
              the mit media lab, and mosaic.
            </p>
            <p>
              elsewhere here are <a href="/friends">my friends</a>,{" "}
              <a href="/media">things i love</a>,{" "}
              <a href="/travel">places i’ve been</a>, and{" "}
              <a href="/taste">things i find beautiful</a>.
            </p>
          </div>
        </details>
        <nav className={styles.links} aria-label="Explore">
          <a href="/work">work</a>
          <a href="/blog">writing</a>
          <a href="/links">links</a>
          <a href="/gallery">gallery</a>
          <a href="https://github.com/tetraslam">github</a>
          <a href="https://x.com/tetraslam">twitter</a>
        </nav>
      </section>
      <footer className={styles.footer}>
        <span>shresht bhowmick</span>
        <a href="/llms.txt">text directory ↗</a>
      </footer>
    </div>
  );
}
