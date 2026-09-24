"use client";

import Form from "next/form";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { SearchIcon } from "@/components/ui/icons";
import { TextField } from "@/components/ui/TextField";
import { setPreferenceCookie } from "@/lib/preference-cookie";
import { LAST_SEARCH_COOKIE, parseSearchLayout } from "@/lib/search-sort";
import styles from "./search.module.css";

/**
 * The query lives in the URL, so a search can be reloaded, shared and reached
 * with the back button. next/form makes the submit a client-side navigation
 * instead of a full page load.
 */
export function SearchForm({ initialQuery }: { initialQuery: string }) {
  const [query, setQuery] = useState(initialQuery);
  // The results write their layout into the address; a new search keeps it.
  const layout = parseSearchLayout(useSearchParams().get("view"));

  return (
    <Form
      action="/search"
      role="search"
      className={styles.form}
      onSubmit={() => {
        // Searching for nothing is how a search is put away for good.
        if (query.trim() === "") setPreferenceCookie(LAST_SEARCH_COOKIE, "");
      }}
    >
      <TextField
        label="Search games"
        hideLabel
        name="q"
        type="search"
        placeholder="Search by title"
        autoComplete="off"
        // An empty search page exists to be typed into.
        autoFocus={initialQuery === ""}
        leading={<SearchIcon />}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onClear={() => setQuery("")}
        className={styles.field}
      />
      {layout !== "grid" && <input type="hidden" name="view" value={layout} />}
      <Button type="submit" variant="primary">
        Search
      </Button>
    </Form>
  );
}
