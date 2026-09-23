"use client";

import { useActionState, useState } from "react";
import { sendSignInLink, type SignInState } from "@/app/auth/actions";
import { Button } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { TextField } from "@/components/ui/TextField";
import styles from "./sign-in.module.css";

export function SignInForm({ next }: { next: string }) {
  const [state, formAction] = useActionState<SignInState, FormData>(sendSignInLink, {
    status: "idle",
  });
  // Which sent confirmation was dismissed, so "use a different address" brings the form back.
  const [dismissed, setDismissed] = useState<string | null>(null);

  if (state.status === "sent" && dismissed !== state.email) {
    return (
      <Notice
        title="Check your email"
        action={
          <Button size="sm" onClick={() => setDismissed(state.email)}>
            Use a different address
          </Button>
        }
      >
        <p>
          If <strong>{state.email}</strong> belongs to a Parlour account, a sign-in link is on its
          way. Open it on this device and press the button on the page it takes you to.
        </p>
        <p className={styles.small}>
          The link works once and expires after an hour. Nothing after a few minutes? Check that
          this is the address your account uses.
        </p>
      </Notice>
    );
  }

  const value = state.status === "invalid" || state.status === "failed" ? state.value : "";

  return (
    <form action={formAction} className={styles.form} noValidate>
      <input type="hidden" name="next" value={next} />
      <TextField
        className={styles.field}
        label="Email address"
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        required
        defaultValue={value}
        error={state.status === "invalid" ? state.message : undefined}
      />
      {state.status === "failed" && (
        <Notice tone="error" title="The link was not sent">
          {state.message}
        </Notice>
      )}
      <SubmitButton>Email me a sign-in link</SubmitButton>
    </form>
  );
}
