"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cx } from "@/lib/cx";
import { transition } from "@/lib/motion";
import { CheckIcon, ChevronDownIcon } from "./icons";
import styles from "./MenuSelect.module.css";

export type MenuOption<T extends string> = {
  value: T;
  label: string;
  description?: string;
  leading?: ReactNode;
};

type MenuSelectProps<T extends string> = {
  label: string;
  options: ReadonlyArray<MenuOption<T>>;
  value: T | null;
  onChange: (value: T) => void;
  placeholder?: string;
  /** Which edge of the trigger the menu lines up with. */
  align?: "start" | "end";
  disabled?: boolean;
  className?: string | undefined;
};

/**
 * A button that opens a short list of choices. The menu grows out of its
 * trigger (transform-origin on the trigger's edge) so it is clear where it
 * came from, and closes back into it.
 */
export function MenuSelect<T extends string>({
  label,
  options,
  value,
  onChange,
  placeholder = "Choose",
  align = "start",
  disabled,
  className,
}: MenuSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const selected = options.find((option) => option.value === value);

  function close({ restoreFocus }: { restoreFocus: boolean }) {
    setOpen(false);
    if (restoreFocus) triggerRef.current?.focus();
  }

  function choose(next: T) {
    onChange(next);
    close({ restoreFocus: true });
  }

  useEffect(() => {
    if (!open) return;
    const selectedIndex = Math.max(
      0,
      options.findIndex((option) => option.value === value),
    );
    itemRefs.current[selectedIndex]?.focus();

    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) close({ restoreFocus: false });
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
    // Focus the selected item only when the menu opens, not on every value change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function onTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
    }
  }

  function onMenuKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const items = itemRefs.current.filter((item): item is HTMLButtonElement => item !== null);
    const index = items.indexOf(document.activeElement as HTMLButtonElement);
    const last = items.length - 1;
    let next: number | undefined;

    switch (event.key) {
      case "ArrowDown":
        next = index >= last ? 0 : index + 1;
        break;
      case "ArrowUp":
        next = index <= 0 ? last : index - 1;
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = last;
        break;
      case "Escape":
        event.preventDefault();
        close({ restoreFocus: true });
        return;
      case "Tab":
        close({ restoreFocus: false });
        return;
      default:
        return;
    }
    event.preventDefault();
    items[next]?.focus();
  }

  return (
    <div ref={rootRef} className={cx(styles.root, className)}>
      <button
        ref={triggerRef}
        type="button"
        className={styles.trigger}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={`${label}: ${selected?.label ?? placeholder}`}
        disabled={disabled}
        data-open={open || undefined}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={onTriggerKeyDown}
      >
        {selected?.leading}
        <span className={cx(styles.triggerLabel, !selected && styles.placeholder)}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDownIcon className={styles.chevron} width={14} height={14} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            id={menuId}
            role="menu"
            aria-label={label}
            className={styles.menu}
            data-align={align}
            style={{ transformOrigin: align === "start" ? "top left" : "top right" }}
            initial={{ opacity: 0, scale: 0.96, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0, transition: transition.enter }}
            exit={{ opacity: 0, scale: 0.98, y: -2, transition: transition.exit }}
            onKeyDown={onMenuKeyDown}
          >
            {options.map((option, index) => {
              const checked = option.value === value;
              return (
                <button
                  key={option.value}
                  ref={(node) => {
                    itemRefs.current[index] = node;
                  }}
                  type="button"
                  role="menuitemradio"
                  aria-checked={checked}
                  tabIndex={-1}
                  className={styles.item}
                  onClick={() => choose(option.value)}
                >
                  {option.leading && <span className={styles.leading}>{option.leading}</span>}
                  <span className={styles.itemText}>
                    <span className={styles.itemLabel}>{option.label}</span>
                    {option.description && (
                      <span className={styles.itemDescription}>{option.description}</span>
                    )}
                  </span>
                  {checked && <CheckIcon className={styles.check} width={14} height={14} />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
