"use client";

import { useEffect, useRef, type ReactNode } from "react";

type AutoSubmitFormProps = {
  action: (formData: FormData) => Promise<void>;
  className?: string | undefined;
  children: ReactNode;
};

/**
 * Submits itself once, as soon as it is on screen, so an emailed link signs
 * you in without a second click. Link scanners that fetch the page without
 * running scripts never trigger it; without JavaScript the form's own button
 * is the fallback.
 */
export function AutoSubmitForm({ action, className, children }: AutoSubmitFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const submitted = useRef(false);

  useEffect(() => {
    // The ref guard stops a second submit in development, where effects run twice.
    if (submitted.current) return;
    submitted.current = true;
    formRef.current?.requestSubmit();
  }, []);

  return (
    <form ref={formRef} action={action} className={className}>
      {children}
    </form>
  );
}
