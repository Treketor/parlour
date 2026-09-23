"use client";

import Form from "next/form";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { SearchIcon } from "@/components/ui/icons";
import { TextField } from "@/components/ui/TextField";
import styles from "./search.module.css";

/**
 * The query lives in the URL, so a search can be reloaded, shared and reached
 * with the back button. next/form makes the submit a client-side navigation
 * instead of a full page load.
 */
export function SearchForm({ initialQuery }: { initialQuery: string }) {
  const [query, setQuery] = useState(initialQuery);

  return (
    <Form action="/search" role="search" className={styles.form}>
      <TextField
        label="Search games"
        hideLabel
        name="q"
        type="search"
        placeholder="Search by title"
        autoComplete="off"
        leading={<SearchIcon />}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onClear={() => setQuery("")}
        className={styles.field}
      />
      <Button type="submit" variant="primary">
        Search
      </Button>
    </Form>
  );
}
