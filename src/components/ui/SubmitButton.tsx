"use client";

import { useFormStatus } from "react-dom";
import { Button, type ButtonSize, type ButtonVariant } from "./Button";

type SubmitButtonProps = {
  children: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string | undefined;
};

/** A submit button that shows its own loading state while the enclosing form is pending. */
export function SubmitButton({
  children,
  variant = "primary",
  size = "md",
  className,
}: SubmitButtonProps) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant={variant} size={size} loading={pending} className={className}>
      {children}
    </Button>
  );
}
