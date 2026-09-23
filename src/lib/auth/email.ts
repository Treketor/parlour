/*
 * Deliberately loose: one @, something either side, a dot in the domain. The
 * real check is whether the sign-in email arrives; this only catches typos
 * like a missing @ before a request is spent on them.
 */
const PLAUSIBLE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type EmailCheck = { ok: true; email: string } | { ok: false; message: string };

export function checkEmail(input: unknown): EmailCheck {
  const email = typeof input === "string" ? input.trim() : "";
  if (email === "") return { ok: false, message: "Enter your email address." };
  if (!PLAUSIBLE_EMAIL.test(email)) {
    return {
      ok: false,
      message: "That does not look like an email address. Check for a missing @ or dot.",
    };
  }
  return { ok: true, email: email.toLowerCase() };
}
