import type { Metadata } from "next";
import { PageHeader } from "@/components/shell/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";

export const metadata: Metadata = {
  title: "Page not found",
};

export default function NotFound() {
  return (
    <>
      <PageHeader title="Page not found" meta="404" />
      <Notice
        title="Nothing lives at this address"
        action={<ButtonLink href="/">Go to your library</ButtonLink>}
      >
        The link may be old, or the address may have a typo. If you followed a link to a game, it
        may have been removed from IGDB.
      </Notice>
    </>
  );
}
