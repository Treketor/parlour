"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { useShouldReduceMotion } from "@/components/Providers";
import { cx } from "@/lib/cx";
import { transition } from "@/lib/motion";
import styles from "./Popover.module.css";

type PopoverProps = {
  /** Names the panel for assistive tech, e.g. "Filters". */
  label: string;
  /** What the trigger shows: text, an icon, a count. */
  trigger: ReactNode;
  children: ReactNode;
  className?: string | undefined;
};

/**
 * A button that unfolds a small panel of controls beneath it, the way a
 * dropdown unfolds its choices. Not modal: the page stays usable, and
 * pressing outside, Escape, or the button again folds it away. Menus inside
 * it count as inside, so choosing from one does not close the panel.
 */
export function Popover({ label, trigger, children, className }: PopoverProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useShouldReduceMotion();

  useEffect(() => {
    if (!open) return;
    // Straight to the first control, so a keyboard user is already inside.
    panelRef.current
      ?.querySelector<HTMLElement>("button, input, [tabindex]:not([tabindex='-1'])")
      ?.focus();

    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    // A menu inside handles its own Escape first; only a free Escape closes the panel.
    if (event.key !== "Escape" || event.defaultPrevented) return;
    event.preventDefault();
    setOpen(false);
    triggerRef.current?.focus();
  }

  return (
    <div ref={rootRef} className={cx(styles.root, className)} onKeyDown={onKeyDown}>
      <button
        ref={triggerRef}
        type="button"
        className={styles.trigger}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        data-open={open || undefined}
        onClick={() => setOpen((current) => !current)}
      >
        {trigger}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={panelRef}
            id={panelId}
            role="group"
            aria-label={label}
            className={styles.panel}
            style={{ transformOrigin: "top right" }}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scaleY: 0.6 }}
            animate={{ opacity: 1, scaleY: 1, transition: transition.enter }}
            exit={
              reduceMotion
                ? { opacity: 0, transition: transition.exit }
                : { opacity: 0, scaleY: 0.8, transition: transition.exit }
            }
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
