"use client";

import { AnimatePresence, motion } from "motion/react";
import { useLayoutEffect, useRef, type ReactNode } from "react";
import { useShouldReduceMotion } from "@/components/Providers";
import { cx } from "@/lib/cx";
import { transition } from "@/lib/motion";
import styles from "./Modal.module.css";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  /** Id of the heading that names the modal. */
  labelledBy: string;
  /** "wide" for pictures, which want the room more than a form does. */
  size?: "default" | "wide";
  /**
   * Finds the opener again when closing re-rendered it, e.g. a card whose list
   * came back from a navigation. Without it, focus would fall to the page.
   */
  returnFocusTo?: (() => HTMLElement | null) | undefined;
  children: ReactNode;
};

/**
 * A box over the middle of the page. Built on a modal <dialog>, so focus
 * stays inside, the page behind is inert and Escape closes it. The dialog is
 * removed only after its exit animation, and focus then returns to whatever
 * opened it.
 */
export function Modal({
  open,
  onClose,
  labelledBy,
  size = "default",
  returnFocusTo,
  children,
}: ModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <ModalDialog
          onClose={onClose}
          labelledBy={labelledBy}
          size={size}
          returnFocusTo={returnFocusTo}
        >
          {children}
        </ModalDialog>
      )}
    </AnimatePresence>
  );
}

function ModalDialog({
  onClose,
  labelledBy,
  size,
  returnFocusTo,
  children,
}: Omit<ModalProps, "open">) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  // Read at close, not open, so it sees the page as it is by then.
  const findOpener = useRef(returnFocusTo);
  useLayoutEffect(() => {
    findOpener.current = returnFocusTo;
  });
  const reduceMotion = useShouldReduceMotion();

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const opener = document.activeElement;
    dialog.showModal();
    return () => {
      if (dialog.open) dialog.close();
      // A frame later: the dialog is still being removed now, and focus given
      // back mid-removal is dropped. By then a navigation that closed it has
      // also rendered, so a replaced opener can be found again.
      requestAnimationFrame(() => {
        // The body means nothing opened it, e.g. the page loaded with it open.
        const kept =
          opener instanceof HTMLElement && opener.isConnected && opener !== document.body;
        const target = kept ? opener : findOpener.current?.();
        target?.focus();
      });
    };
  }, []);

  // Rises a little and settles to full size; reduced motion keeps only the fade.
  const hidden = reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: 8 };

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby={labelledBy}
      onCancel={(event) => {
        // Escape: animate out instead of the browser closing it at once.
        event.preventDefault();
        onClose();
      }}
    >
      <motion.div
        className={styles.backdrop}
        aria-hidden="true"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: transition.enter }}
        exit={{ opacity: 0, transition: transition.exit }}
      />
      <motion.div
        className={cx(styles.box, size === "wide" && styles.wide)}
        initial={hidden}
        animate={{ opacity: 1, scale: 1, y: 0, transition: transition.enter }}
        exit={{ ...hidden, transition: transition.exit }}
      >
        {children}
      </motion.div>
    </dialog>
  );
}
