import type { Metadata } from "next";
import { PageHeader } from "@/components/shell/PageHeader";
import { SignInPrompt } from "@/components/shell/SignInPrompt";
import { listLibrary, listTags } from "@/lib/data/library";
import { parseLibraryView } from "@/lib/library-view";
import { firstParam } from "@/lib/search-params";
import { createClient } from "@/lib/supabase/server";
import { LibraryBrowser } from "./LibraryBrowser";

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

  const [items, tags, params] = await Promise.all([
    listLibrary(supabase),
    listTags(supabase),
    searchParams,
  ]);
  const entry = firstParam(params.entry);

  return (
    <LibraryBrowser
      items={items}
      tags={tags}
      initialView={parseLibraryView(params)}
      initialEntryId={items.some((item) => item.id === entry) ? entry : null}
    />
  );
}
