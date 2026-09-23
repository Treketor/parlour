"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { checkEmail } from "@/lib/auth/email";
import { parseEmailOtpType } from "@/lib/auth/otp";
import { safeRedirectPath } from "@/lib/auth/redirect";
import { createClient } from "@/lib/supabase/server";

export type SignInState =
  | { status: "idle" }
  | { status: "sent"; email: string }
  | { status: "invalid"; message: string; value: string }
  | { status: "failed"; message: string; value: string };

/**
 * Emails a sign-in link. New accounts are never created here: Parlour is
 * private for now, so an unknown address gets the same "check your email"
 * answer as a known one, which avoids revealing who has an account.
 */
export async function sendSignInLink(
  _previous: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const raw = formData.get("email");
  const value = typeof raw === "string" ? raw : "";
  const checked = checkEmail(raw);
  if (!checked.ok) return { status: "invalid", message: checked.message, value };

  const origin = (await headers()).get("origin");
  if (!origin) {
    return {
      status: "failed",
      message: "The request was missing its origin. Reload the page and try again.",
      value,
    };
  }

  const next = safeRedirectPath(formData.get("next")?.toString());
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: checked.email,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: `${origin}/auth/confirm?next=${encodeURIComponent(next)}`,
    },
  });

  if (!error || error.code === "otp_disabled" || error.code === "signup_disabled") {
    return { status: "sent", email: checked.email };
  }
  if (error.status === 429 || error.code === "over_email_send_rate_limit") {
    return {
      status: "failed",
      message: "A link was sent very recently. Wait a minute, then ask for another.",
      value,
    };
  }
  // Supabase's built-in sender only delivers to the project's team members until a
  // custom email service is set up (DECISIONS.md 025). Says nothing about accounts.
  if (error.code === "email_address_not_authorized") {
    return {
      status: "failed",
      message:
        "Sign-in emails cannot be sent to this address yet. Use the address you were invited with.",
      value,
    };
  }
  console.error("Sign-in link failed", error);
  return {
    status: "failed",
    message: "The sign-in link could not be sent. Try again in a moment.",
    value,
  };
}

/**
 * Finishes sign-in from an emailed link. The confirm page submits this as soon
 * as it loads in a browser, rather than the server acting on the GET, so link
 * scanners that fetch pages without running scripts cannot spend the token.
 */
export async function confirmSignIn(formData: FormData): Promise<never> {
  const next = safeRedirectPath(formData.get("next")?.toString());
  const tokenHash = formData.get("token_hash")?.toString();
  const type = parseEmailOtpType(formData.get("type")?.toString());
  const code = formData.get("code")?.toString();
  const supabase = await createClient();

  let failed = true;
  if (tokenHash && type) {
    failed = Boolean((await supabase.auth.verifyOtp({ token_hash: tokenHash, type })).error);
  } else if (code) {
    failed = Boolean((await supabase.auth.exchangeCodeForSession(code)).error);
  }

  redirect(failed ? "/sign-in?error=link" : next);
}

export async function signOut(): Promise<never> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
