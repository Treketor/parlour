import type { Metadata } from "next";
import { PageHeader } from "@/components/shell/PageHeader";
import { formatDate } from "@/lib/format";
import styles from "../legal.module.css";
import { LEGAL_UPDATED } from "../updated";

export const metadata: Metadata = {
  title: "Privacy",
};

export default function PrivacyPage() {
  return (
    <>
      <PageHeader title="Privacy" meta={`Updated ${formatDate(LEGAL_UPDATED.privacy)}`} />
      <div className={styles.body}>
        <p>
          This page describes what Parlour stores and shares <strong>today</strong>. It changes
          whenever that changes, and the date above moves with it.
        </p>

        <section>
          <h2>What Parlour stores about you</h2>
          <p>
            Nothing, at the moment. There are no accounts yet, and nothing you do on the site is
            saved on a server or in your browser.
          </p>
          <p>When accounts and libraries arrive, this page will list exactly what is kept:</p>
          <ul>
            <li>your email address, to sign you in;</li>
            <li>the games in your library, with their progress, ratings, tags and notes;</li>
            <li>your queue and your price region.</li>
          </ul>
        </section>

        <section>
          <h2>Cookies and tracking</h2>
          <p>
            Parlour sets no cookies and runs no analytics, advertising or tracking scripts. When
            sign-in exists it will need one cookie to keep you signed in, and nothing else.
          </p>
        </section>

        <section>
          <h2>Other services</h2>
          <p>
            Pages are served by the hosting provider, which keeps short-lived request logs (such as
            IP addresses) to run and protect the service. Game images will load from IGDB, and
            trailers will play through YouTube&rsquo;s privacy-enhanced mode, which avoids tracking
            cookies until you press play. Links to stores go directly to those stores.
          </p>
          <p>Your data is never sold or shared for marketing.</p>
        </section>

        <section>
          <h2>Questions and deletion</h2>
          <p>
            Open an issue on the{" "}
            <a href="https://github.com/Treketor/parlour/issues" rel="noopener">
              project repository
            </a>
            . Once accounts exist, deleting your account will delete everything listed above.
          </p>
        </section>
      </div>
    </>
  );
}
