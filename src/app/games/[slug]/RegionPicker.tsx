"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { MenuOption } from "@/components/ui/MenuSelect";
import { Select } from "@/components/ui/Select";
import { setPriceRegion } from "./actions";
import styles from "./game.module.css";

type RegionPickerProps = {
  region: string;
  /** Region codes with their names, worked out on the server so both sides render the same words. */
  options: ReadonlyArray<MenuOption<string>>;
};

/**
 * Which country's shops and currency the prices are for. The choice is
 * saved, then the page asks the server again for that region's prices.
 */
export function RegionPicker({ region, options }: RegionPickerProps) {
  const router = useRouter();
  const [value, setValue] = useState(region);
  const [error, setError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();

  function choose(next: string) {
    if (next === value) return;
    const previous = value;
    setValue(next);
    setError(undefined);
    startTransition(async () => {
      const result = await setPriceRegion(next);
      if (result.status === "saved") {
        router.refresh();
      } else {
        setValue(previous);
        setError(result.message);
      }
    });
  }

  return (
    <Select
      size="sm"
      label="Prices for"
      hideLabel
      options={options}
      value={value}
      onChange={choose}
      error={error}
      disabled={pending}
      className={styles.regionPicker}
    />
  );
}
