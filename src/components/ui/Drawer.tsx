"use client";

import { AnimatePresence, motion } from "motion/react";
import { useLayoutEffect, useRef, type ReactNode } from "react";
import { useShouldReduceMotion } from "@/components/Providers";
import { duration, easing, transition } from "@/lib/motion";
import styles from "./Drawer.module.css";

type DrawerProps = {
  open: boolean;
  onClose: () => void;
  /** Id of the heading that names the drawer. */
  labelledBy: string;
  children: ReactNode;
};

/**
 * A panel that slides in over the page from the right. Built on a modal
 * <dialog>, so focus stays inside, the page behind is inert and Escape
 * closes it. The dialog is removed only after its exit animation, and focus
 * then returns to whatever opened it.
 */
export function Drawer({ open, onClose, labelledBy, children }: DrawerProps) {
  return (
    <AnimatePresence>
      {open && (
        <DrawerDialog onClose={onClose} labelledBy={labelledBy}>
          {children}
        </DrawerDialog>
      )}
    </AnimatePresence>
  );
}

function DrawerDialog({ onClose, labelledBy, children }: Omit<DrawerProps, "open">) {
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

  // A panel travels its own width; reduced motion keeps only the fade.
  const offscreen = reduceMotion ? { opacity: 0 } : { x: "100%" };
  const onscreen = reduceMotion ? { opacity: 1 } : { x: 0 };

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
        className={styles.panel}
        initial={offscreen}
        animate={{
          ...onscreen,
          transition: { duration: duration.slow / 1000, ease: [...easing.out] },
        }}
        exit={{
          ...offscreen,
          transition: { duration: duration.base / 1000, ease: [...easing.in] },
        }}
      >
        {children}
      </motion.div>
    </dialog>
  );
}
