"use client";

import { AnimatePresence, motion } from "motion/react";
import { useLayoutEffect, useRef, type ReactNode } from "react";
import { useShouldReduceMotion } from "@/components/Providers";
import { transition } from "@/lib/motion";
import styles from "./Modal.module.css";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  /** Id of the heading that names the modal. */
  labelledBy: string;
  children: ReactNode;
};

/**
 * A box over the middle of the page. Built on a modal <dialog>, so focus
 * stays inside, the page behind is inert and Escape closes it. The dialog is
 * removed only after its exit animation, and focus then returns to whatever
 * opened it.
 */
export function Modal({ open, onClose, labelledBy, children }: ModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <ModalDialog onClose={onClose} labelledBy={labelledBy}>
          {children}
        </ModalDialog>
      )}
    </AnimatePresence>
  );
}

function ModalDialog({ onClose, labelledBy, children }: Omit<ModalProps, "open">) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const reduceMotion = useShouldReduceMotion();

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const opener = document.activeElement;
    dialog.showModal();
    return () => {
      if (dialog.open) dialog.close();
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
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
        className={styles.box}
        initial={hidden}
        animate={{ opacity: 1, scale: 1, y: 0, transition: transition.enter }}
        exit={{ ...hidden, transition: transition.exit }}
      >
        {children}
      </motion.div>
    </dialog>
  );
}
