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
            Parlour runs no advertising or tracking scripts. It counts page views and measures how
            fast pages load with Vercel Web Analytics and Speed Insights. Both work without cookies
            and cannot follow you across sites or from one day to the next. What they receive is the
            page address, with anything personal removed first (such as sign-in codes and which
            library entry is open), plus your browser, device type and country.
          </p>
          <p>
            Signing in sets cookies that hold your session, and signing out removes them. A few
            small cookies remember choices on this device, whether or not you sign in: the
            library&rsquo;s layout and order, your last search, and the region prices are shown for.
            They hold nothing that identifies you.
          </p>
        </section>

        <section>
          <h2>Other services</h2>
          <p>
            Accounts and libraries are stored with Supabase, in its Tokyo region, and sign-in emails
            are sent through it. Pages are served by Vercel, which keeps short-lived request logs
            (such as IP addresses) to run and protect the service. Game images load from IGDB, and
            trailers play through YouTube&rsquo;s privacy-enhanced mode, which avoids tracking
            cookies until you press play. Links to shops go through IsThereAnyDeal, which may add
            its affiliate tags; the shop can see that you came from there.
          </p>
          <p>
            When you search, Parlour sends the words you typed to IGDB from its own server. Nothing
            that identifies you goes with them, and searches are kept for a day so the same one is
            not sent twice. In the same way, a game&rsquo;s name and your chosen region go to RAWG,
            Steam and IsThereAnyDeal for scores and prices, never anything about you.
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
