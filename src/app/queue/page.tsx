import type { Metadata } from "next";
import { PageHeader } from "@/components/shell/PageHeader";
import { SignInPrompt } from "@/components/shell/SignInPrompt";
import { ButtonLink } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";
import { listQueue } from "@/lib/data/queue";
import { formatCount } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { QueueList } from "./QueueList";

export const metadata: Metadata = {
  title: "Queue",
};

export default async function QueuePage() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();

  if (!auth?.claims) {
    return (
      <>
        <PageHeader title="Queue" meta="What you mean to play next, in order" />
        <SignInPrompt what="your queue" returnTo="/queue" />
      </>
    );
  }

  const items = await listQueue(supabase);

  return (
    <>
      <PageHeader
        title="Queue"
        meta={
          items.length === 0
            ? "What you mean to play next, in order"
            : `${formatCount(items.length, "game")} lined up`
        }
      />
      {items.length === 0 ? (
        <Notice
          title="Nothing queued"
          action={<ButtonLink href="/">Go to your library</ButtonLink>}
        >
          Open a game in your library and choose Add to queue: play it next, or add it to the end.
          The top of the queue is what you play after your current game; drag to change the order.
          Finishing or abandoning a game takes it off.
        </Notice>
      ) : (
        <QueueList initialItems={items} />
      )}
    </>
  );
}
