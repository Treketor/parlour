import type { Metadata } from "next";
import { PageHeader } from "@/components/shell/PageHeader";
import { SignInPrompt } from "@/components/shell/SignInPrompt";
import { listLibrary } from "@/lib/data/library";
import { formatCount } from "@/lib/format";
import { parseLibraryView } from "@/lib/library-view";
import { createClient } from "@/lib/supabase/server";
import { LibraryBrowser } from "./LibraryBrowser";
import { LibraryEmpty } from "./LibraryEmpty";

export const metadata: Metadata = {
  // The root layout's title template skips its own page, so the full title is set here.
  title: { absolute: "Library | Parlour" },
};

export default async function LibraryPage({ searchParams }: PageProps<"/">) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) {
    return (
      <>
        <PageHeader title="Library" />
        <SignInPrompt what="your library" returnTo="/" />
      </>
    );
  }

  const [items, params] = await Promise.all([listLibrary(supabase), searchParams]);

  return (
    <>
      <PageHeader
        title="Library"
        meta={items.length === 0 ? "No games yet" : formatCount(items.length, "game")}
      />
      {items.length === 0 ? (
        <LibraryEmpty />
      ) : (
        <LibraryBrowser items={items} initialView={parseLibraryView(params)} />
      )}
    </>
  );
}
