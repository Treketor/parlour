import type { Metadata } from "next";
import { PageHeader } from "@/components/shell/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { parseEmailOtpType } from "@/lib/auth/otp";
import { safeRedirectPath } from "@/lib/auth/redirect";
import { firstParam } from "@/lib/search-params";
import { confirmSignIn } from "../actions";
import { AutoSubmitForm } from "./AutoSubmitForm";
import styles from "../../sign-in/sign-in.module.css";

export const metadata: Metadata = {
  title: "Signing in",
  // A one-time link page has no business in search results or link previews.
  robots: { index: false, follow: false },
};

export default async function ConfirmPage({ searchParams }: PageProps<"/auth/confirm">) {
  const params = await searchParams;
  const tokenHash = firstParam(params.token_hash);
  const type = parseEmailOtpType(firstParam(params.type));
  const code = firstParam(params.code);
  const next = safeRedirectPath(firstParam(params.next));
  const usable = (tokenHash !== "" && type !== null) || code !== "";

  return (
    <>
      <PageHeader title="Signing you in" />
      <div className={styles.panel}>
        {usable ? (
          <AutoSubmitForm action={confirmSignIn} className={styles.form}>
            <p>One moment. If nothing happens, press the button.</p>
            <input type="hidden" name="next" value={next} />
            {tokenHash && <input type="hidden" name="token_hash" value={tokenHash} />}
            {type && <input type="hidden" name="type" value={type} />}
            {code && <input type="hidden" name="code" value={code} />}
            <SubmitButton>Sign in to Parlour</SubmitButton>
          </AutoSubmitForm>
        ) : (
          <Notice
            tone="error"
            title="This link is incomplete"
            action={<ButtonLink href="/sign-in">Get a new link</ButtonLink>}
          >
            Part of the address is missing, which usually happens when a link is copied by hand or
            wraps across lines in an email.
          </Notice>
        )}
      </div>
    </>
  );
}
