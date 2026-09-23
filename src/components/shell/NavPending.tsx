"use client";

import { useLinkStatus } from "next/link";
import { Spinner } from "@/components/ui/Spinner";
import styles from "./NavPending.module.css";

/*
 * Feedback for a nav link whose page is still on its way from the server.
 * Always rendered and faded rather than mounted, so the link never shifts,
 * and delayed slightly so quick navigations do not flash it.
 */

/** A spinner beside a large menu item. */
export function NavPendingSpinner() {
  const { pending } = useLinkStatus();
  return (
    <span className={styles.spinner} data-pending={pending || undefined} aria-hidden="true">
      <Spinner size={16} />
    </span>
  );
}

/** A faint marker under a header link, ahead of the real one sliding over. */
export function NavPendingMarker() {
  const { pending } = useLinkStatus();
  return <span className={styles.marker} data-pending={pending || undefined} aria-hidden="true" />;
}
