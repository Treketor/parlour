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
            Accounts are invite-only for now. If you have one, Parlour keeps only what it needs to
            show your library back to you:
          </p>
          <ul>
            <li>your email address, to send sign-in links;</li>
            <li>the games in your library, with their progress, ratings, tags and notes;</li>
            <li>your queue, your price region, and a history of progress and rating changes.</li>
          </ul>
          <p>
            Visitors without an account leave nothing behind: browsing and searching are not saved.
          </p>
        </section>

        <section>
          <h2>Cookies and tracking</h2>
          <p>
            Parlour runs no analytics, advertising or tracking scripts. Signing in sets cookies that
            hold your session, and signing out removes them. Visitors who do not sign in get no
            cookies at all.
          </p>
        </section>

        <section>
          <h2>Other services</h2>
          <p>
            Accounts and libraries are stored with Supabase, in its Tokyo region, and sign-in emails
            are sent through it. Pages are served by the hosting provider, which keeps short-lived
            request logs (such as IP addresses) to run and protect the service. Game images will
            load from IGDB, and trailers will play through YouTube&rsquo;s privacy-enhanced mode,
            which avoids tracking cookies until you press play. Links to stores go directly to those
            stores.
          </p>
          <p>
            When you search, Parlour sends the words you typed to IGDB from its own server. Nothing
            that identifies you goes with them, and searches are kept for a day so the same one is
            not sent twice.
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
            . Deleting your account deletes everything listed above, including the history.
          </p>
        </section>
      </div>
    </>
  );
}
