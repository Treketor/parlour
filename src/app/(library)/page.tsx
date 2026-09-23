import type { Metadata } from "next";
import { PageHeader } from "@/components/shell/PageHeader";
import { SignInPrompt } from "@/components/shell/SignInPrompt";
import { countLibraryEntries } from "@/lib/data/library";
import { formatCount } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { LibraryEmpty } from "./LibraryEmpty";

export const metadata: Metadata = {
  // The root layout's title template skips its own page, so the full title is set here.
  title: { absolute: "Library | Parlour" },
};

export default async function LibraryPage() {
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

  const count = await countLibraryEntries(supabase);

  // Browsing entries arrives in stage 6; until then a library with games shows its count.
  return (
    <>
      <PageHeader
        title="Library"
        meta={count === 0 ? "No games yet" : formatCount(count, "game")}
      />
      {count === 0 && <LibraryEmpty />}
    </>
  );
}
