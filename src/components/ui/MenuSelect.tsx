"use client";

import { AnimatePresence, motion } from "motion/react";
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { useShouldReduceMotion } from "@/components/Providers";
import { cx } from "@/lib/cx";
import { transition } from "@/lib/motion";
import { CheckIcon, ChevronDownIcon, PlusIcon } from "./icons";
import styles from "./MenuSelect.module.css";

export type MenuOption<T extends string> = {
  value: T;
  label: string;
  description?: string;
  leading?: ReactNode;
  /** Shown but not choosable; say why in the description. */
  disabled?: boolean;
};

type MenuSelectProps<T extends string> = {
  label: string;
  options: ReadonlyArray<MenuOption<T>>;
  value: T | null;
  onChange: (value: T) => void;
  placeholder?: string;
  /** Which edge of the trigger the menu prefers to line up with; it flips if it would leave the screen. */
  align?: "start" | "end";
  disabled?: boolean;
  /**
   * Action mode: the trigger always reads `placeholder` (e.g. "Add") and the
   * items are commands rather than a current value, so nothing is checked.
   */
  action?: boolean;
  size?: "sm" | "md";
  /** Stretch the trigger to its container, e.g. across a card. */
  fullWidth?: boolean;
  /** Set the trigger label in the strong weight, for controls that act rather than describe. */
  strong?: boolean;
  /** Draw the trigger as a form field, to sit in a row of text fields. */
  field?: boolean;
  /** Shown before the trigger label, e.g. a tick for something already chosen. */
  icon?: ReactNode;
  /** For a visible <label htmlFor>. */
  id?: string;
  /** Submits the value with a surrounding form, like a native select would. */
  name?: string;
  "aria-describedby"?: string | undefined;
  /** Draws the error edge; the message itself is linked through aria-describedby. */
  invalid?: boolean | undefined;
  className?: string | undefined;
};

type Placement = { side: "bottom" | "top"; align: "start" | "end" };

/** Space kept between a menu and the edge of the screen. */
const VIEWPORT_MARGIN = 8;

/** The choices wait for the frame to open most of the way before fading in. */
const ITEM_DELAY_S = 0.06;

/** How long typed letters keep adding to one search, as in a native select. */
const TYPEAHEAD_RESET_MS = 500;

/**
 * A button that opens a short list of choices. The menu grows out of its
 * trigger (transform-origin on the trigger's edge) so it is clear where it
 * came from, and closes back into it. Every dropdown in the app is one of
 * these: a native select's popup is drawn by the system and cannot move
 * with the rest of the interface (DECISIONS.md 035).
 */
export function MenuSelect<T extends string>({
  label,
  options,
  value,
  onChange,
  placeholder = "Choose",
  align = "start",
  disabled,
  action = false,
  size = "md",
  fullWidth = false,
  strong = action,
  field = false,
  icon,
  id,
  name,
  "aria-describedby": describedBy,
  invalid,
  className,
}: MenuSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const reduceMotion = useShouldReduceMotion();
  const [placement, setPlacement] = useState<Placement>({ side: "bottom", align });
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const typeahead = useRef({ text: "", at: 0 });
  const selected = action ? undefined : options.find((option) => option.value === value);

  function close({ restoreFocus }: { restoreFocus: boolean }) {
    setOpen(false);
    if (restoreFocus) triggerRef.current?.focus();
  }

  function choose(next: T) {
    close({ restoreFocus: !action });
    // In action mode the caller usually replaces this control, so it decides where focus goes.
    onChange(next);
  }

  // Measured before paint, so a menu that would run off the screen opens on
  // the other side instead of appearing there and jumping.
  useLayoutEffect(() => {
    if (!open) return;
    const trigger = triggerRef.current?.getBoundingClientRect();
    const menu = menuRef.current;
    if (!trigger || !menu) return;

    const width = menu.offsetWidth;
    const height = menu.offsetHeight;
    const below = window.innerHeight - trigger.bottom - VIEWPORT_MARGIN;
    const above = trigger.top - VIEWPORT_MARGIN;
    const fitsStart = trigger.left + width <= window.innerWidth - VIEWPORT_MARGIN;
    const fitsEnd = trigger.right - width >= VIEWPORT_MARGIN;

    setPlacement({
      side: height > below && above > below ? "top" : "bottom",
      align:
        align === "start" ? (fitsStart || !fitsEnd ? "start" : "end") : fitsEnd ? "end" : "start",
    });
  }, [open, align]);

  useEffect(() => {
    if (!open) return;
    const selectedIndex = Math.max(
      0,
      options.findIndex((option) => option.value === value),
    );
    // Focusing also scrolls a long list to the current choice.
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

  /** Moves to the next item starting with what was typed, as a native select does. */
  function jumpTo(items: HTMLButtonElement[], index: number, key: string): number | undefined {
    const now = Date.now();
    const state = typeahead.current;
    state.text = now - state.at > TYPEAHEAD_RESET_MS ? key : state.text + key;
    state.at = now;
    const search = state.text.toLowerCase();
    // A repeated single letter cycles through the items starting with it.
    const start = search.length === 1 ? index + 1 : Math.max(index, 0);
    for (let step = 0; step < items.length; step++) {
      const candidate = (start + step) % items.length;
      const text = options[candidate]?.label.toLowerCase() ?? "";
      if (text.startsWith(search)) return candidate;
    }
    return undefined;
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
        if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
          next = jumpTo(items, index, event.key);
          if (next === undefined) return;
          break;
        }
        return;
    }
    event.preventDefault();
    items[next]?.focus();
  }

  const fromTop = placement.side === "bottom";
  const origin = `${fromTop ? "top" : "bottom"} ${placement.align === "start" ? "left" : "right"}`;

  return (
    <div ref={rootRef} className={cx(styles.root, fullWidth && styles.fullWidth, className)}>
      {name && <input type="hidden" name={name} value={value ?? ""} />}
      <button
        ref={triggerRef}
        id={id}
        type="button"
        className={cx(
          styles.trigger,
          action && styles.actionTrigger,
          field && styles.field,
          size === "sm" && styles.small,
          strong && styles.strong,
        )}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={action ? label : `${label}: ${selected?.label ?? placeholder}`}
        aria-describedby={describedBy}
        data-invalid={invalid || undefined}
        disabled={disabled}
        data-open={open || undefined}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={onTriggerKeyDown}
      >
        {icon ?? selected?.leading ?? (action && <PlusIcon width={12} height={12} />)}
        <span className={cx(styles.triggerLabel, !selected && !action && styles.placeholder)}>
          {selected?.label ?? placeholder}
        </span>
        {/* An action reads as a button: what it does, not a value to change. */}
        {!action && <ChevronDownIcon className={styles.chevron} width={14} height={14} />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={menuRef}
            id={menuId}
            role="menu"
            aria-label={label}
            className={styles.menu}
            data-side={placement.side}
            data-align={placement.align}
            style={{ transformOrigin: origin }}
            // Unfolds from the edge of its box: the frame stretches out of the
            // trigger and the choices fade in once it has room, so the brief
            // squash never shows on the text. Reduced motion keeps the fade.
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scaleY: 0.4 }}
            animate={{ opacity: 1, scaleY: 1, transition: transition.enter }}
            exit={
              reduceMotion
                ? { opacity: 0, transition: transition.exit }
                : { opacity: 0, scaleY: 0.7, transition: transition.exit }
            }
            onKeyDown={onMenuKeyDown}
          >
            {options.map((option, index) => {
              const checked = option.value === value;
              return (
                <motion.button
                  key={option.value}
                  ref={(node: HTMLButtonElement | null) => {
                    itemRefs.current[index] = node;
                  }}
                  type="button"
                  role={action ? "menuitem" : "menuitemradio"}
                  aria-checked={action ? undefined : checked}
                  // Focusable but inert, so the reason in its description can still be read.
                  aria-disabled={option.disabled || undefined}
                  tabIndex={-1}
                  className={styles.item}
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: 1,
                    transition: { ...transition.enter, delay: reduceMotion ? 0 : ITEM_DELAY_S },
                  }}
                  onClick={() => {
                    if (!option.disabled) choose(option.value);
                  }}
                >
                  {option.leading && <span className={styles.leading}>{option.leading}</span>}
                  <span className={styles.itemText}>
                    <span className={styles.itemLabel}>{option.label}</span>
                    {option.description && (
                      <span className={styles.itemDescription}>{option.description}</span>
                    )}
                  </span>
                  {checked && !action && (
                    <CheckIcon className={styles.check} width={14} height={14} />
                  )}
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
