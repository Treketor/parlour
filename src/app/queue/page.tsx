import type { Metadata } from "next";
import { PageHeader } from "@/components/shell/PageHeader";
import { SignInPrompt } from "@/components/shell/SignInPrompt";
import { ButtonLink } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";
import { getUserId } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Queue",
};

export default async function QueuePage() {
  const signedIn = (await getUserId()) !== null;

  return (
    <>
      <PageHeader title="Queue" meta="What you mean to play next, in order" />
      {signedIn ? (
        <Notice
          title="Nothing queued"
          action={<ButtonLink href="/">Go to your library</ButtonLink>}
        >
          Queue games from your library to line up what comes next. The top of the queue is what you
          play after your current game; drag to change the order.
        </Notice>
      ) : (
        <SignInPrompt what="your queue" returnTo="/queue" />
      )}
    </>
  );
}
