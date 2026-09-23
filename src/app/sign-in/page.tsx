import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shell/PageHeader";
import { Notice } from "@/components/ui/Notice";
import { safeRedirectPath } from "@/lib/auth/redirect";
import { firstParam } from "@/lib/search-params";
import { getUserId } from "@/lib/supabase/server";
import { SignInForm } from "./SignInForm";
import styles from "./sign-in.module.css";

export const metadata: Metadata = {
  title: "Sign in",
};

export default async function SignInPage({ searchParams }: PageProps<"/sign-in">) {
  const params = await searchParams;
  const next = safeRedirectPath(firstParam(params.next));

  if (await getUserId()) redirect(next);

  return (
    <>
      <PageHeader
        title="Sign in"
        meta="Parlour is private for now: only existing accounts can sign in"
      />
      <div className={styles.panel}>
        {firstParam(params.error) === "link" && (
          <Notice tone="error" title="That sign-in link did not work">
            Links work once and expire after an hour. Send yourself a new one below.
          </Notice>
        )}
        <SignInForm next={next} />
      </div>
    </>
  );
}
