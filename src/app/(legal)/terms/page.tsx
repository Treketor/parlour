import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/shell/PageHeader";
import { formatDate } from "@/lib/format";
import styles from "../legal.module.css";
import { LEGAL_UPDATED } from "../updated";

export const metadata: Metadata = {
  title: "Terms",
};

export default function TermsPage() {
  return (
    <>
      <PageHeader title="Terms" meta={`Updated ${formatDate(LEGAL_UPDATED.terms)}`} />
      <div className={styles.body}>
        <p>
          Parlour is a personal, non-commercial project for keeping track of games. These terms are
          short because the project is small; they will grow if it does.
        </p>

        <section>
          <h2>Using Parlour</h2>
          <p>
            Use it to catalogue games you own, play or want to play. Do not use it to scrape, resell
            or bulk-copy the game and price data it shows, and do not try to break or overload it.
          </p>
        </section>

        <section>
          <h2>Your content</h2>
          <p>
            Ratings, notes and tags you write are yours. Parlour only stores them so it can show
            them back to you, and deletes them when you ask.
          </p>
        </section>

        <section>
          <h2>Data from other services</h2>
          <p>
            Game details, images and prices come from other services and belong to them and their
            sources. They can be wrong or out of date, and prices in particular change often. See{" "}
            <Link href="/data-sources">data sources</Link> for who provides what.
          </p>
        </section>

        <section>
          <h2>No guarantees</h2>
          <p>
            Parlour is provided as it is, without warranties. It may change, pause or stop. Keep
            your own copy of anything you cannot afford to lose.
          </p>
        </section>

        <section>
          <h2>Changes</h2>
          <p>
            When these terms change, the date at the top changes too. The full history is in the{" "}
            <a href="https://github.com/Treketor/parlour" rel="noopener">
              project repository
            </a>
            .
          </p>
        </section>
      </div>
    </>
  );
}
