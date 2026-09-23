import { ButtonLink } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";

type SignInPromptProps = {
  /** What the visitor would see if signed in, e.g. "your library". */
  what: string;
  /** Where to come back to after signing in. */
  returnTo: string;
};

export function SignInPrompt({ what, returnTo }: SignInPromptProps) {
  return (
    <Notice
      title={`Sign in to see ${what}`}
      action={
        <ButtonLink href={`/sign-in?next=${encodeURIComponent(returnTo)}`} variant="primary">
          Sign in
        </ButtonLink>
      }
    >
      Libraries and queues are private to their owner. Parlour is invite-only for now.
    </Notice>
  );
}
