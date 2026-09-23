import type { InputHTMLAttributes, ReactNode } from "react";
import { cx } from "@/lib/cx";
import { CheckIcon } from "./icons";
import styles from "./Checkbox.module.css";

type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  children: ReactNode;
};

/** A native checkbox kept in the tree for semantics and keyboard; the box is drawn over it. */
export function Checkbox({ children, className, ...rest }: CheckboxProps) {
  return (
    <label className={cx(styles.checkbox, className)}>
      <input type="checkbox" className={styles.input} {...rest} />
      <span className={styles.box} aria-hidden="true">
        <CheckIcon className={styles.mark} width={12} height={12} strokeWidth={2} />
      </span>
      <span className={styles.label}>{children}</span>
    </label>
  );
}
