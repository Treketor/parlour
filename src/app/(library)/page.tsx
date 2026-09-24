import type { Metadata } from "next";
import { cookies } from "next/headers";
import { PageHeader } from "@/components/shell/PageHeader";
import { SignInPrompt } from "@/components/shell/SignInPrompt";
import { listLibrary, listTags } from "@/lib/data/library";
import { queuePositions } from "@/lib/data/queue";
import {
  LIBRARY_PREFERENCES_COOKIE,
  parseLibraryView,
  withLibraryPreferences,
} from "@/lib/library-view";
import { decodePreference } from "@/lib/preference-cookie";
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

  const [items, tags, queue, params] = await Promise.all([
    listLibrary(supabase),
    listTags(supabase),
    queuePositions(supabase),
    searchParams,
  ]);
  const entry = firstParam(params.entry);
  const remembered = decodePreference((await cookies()).get(LIBRARY_PREFERENCES_COOKIE)?.value);

  return (
    <LibraryBrowser
      items={items}
      tags={tags}
      queue={queue}
      initialView={parseLibraryView(withLibraryPreferences(params, remembered))}
      initialEntryId={items.some((item) => item.id === entry) ? entry : null}
    />
  );
}
