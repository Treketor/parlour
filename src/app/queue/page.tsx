import type { Metadata } from "next";
import { PageHeader } from "@/components/shell/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";

export const metadata: Metadata = {
  title: "Queue",
};

export default function QueuePage() {
  return (
    <>
      <PageHeader title="Queue" meta="What you mean to play next, in order" />
      <Notice title="Nothing queued" action={<ButtonLink href="/">Go to your library</ButtonLink>}>
        Queue games from your library to line up what comes next. The top of the queue is what you
        play after your current game; drag to change the order.
      </Notice>
    </>
  );
}
