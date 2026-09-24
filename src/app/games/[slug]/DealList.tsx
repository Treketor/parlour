"use client";

import { motion } from "motion/react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ExternalIcon } from "@/components/ui/icons";
import { transition } from "@/lib/motion";
import styles from "./game.module.css";

/** A current price, already formatted on the server. */
export type DealRow = {
  shop: string;
  price: string;
  regular: string | null;
  cut: number;
  /** How it is delivered, e.g. "Steam key", when that is not the shop's own. */
  delivery: string | null;
  voucher: string | null;
  url: string;
};

/** Shops shown before "Show all": the cheapest few say most of it. */
const PREVIEW = 5;

/** Every shop selling it in this region, cheapest first. */
export function DealList({ deals }: { deals: readonly DealRow[] }) {
  const [all, setAll] = useState(false);
  const shown = all ? deals : deals.slice(0, PREVIEW);

  return (
    <>
      <ul className={styles.deals}>
        {shown.map((deal, index) => (
          <motion.li
            key={`${deal.shop}-${deal.url}`}
            // Only shops revealed by "Show all" fade in; the first few are simply there.
            initial={index < PREVIEW ? false : { opacity: 0 }}
            animate={{ opacity: 1, transition: transition.enter }}
          >
            <a href={deal.url} target="_blank" rel="noopener" className={styles.deal}>
              <span className={styles.dealShop}>
                {deal.shop}
                <ExternalIcon width={12} height={12} className={styles.linkIcon} />
                <span className="visually-hidden">(opens in a new tab)</span>
              </span>
              <span className={styles.dealNote}>
                {[deal.delivery, deal.voucher && `with code ${deal.voucher}`]
                  .filter(Boolean)
                  .join(", ")}
              </span>
              <span className={styles.dealPrice}>
                {deal.cut > 0 && <span className={styles.dealCut}>-{deal.cut}%</span>}
                {deal.regular && <s className={styles.dealRegular}>{deal.regular}</s>}
                <strong>{deal.price}</strong>
              </span>
            </a>
          </motion.li>
        ))}
      </ul>
      {deals.length > PREVIEW && (
        <Button
          size="sm"
          onClick={() => setAll((current) => !current)}
          className={styles.moreButton}
        >
          {all ? "Show fewer" : `Show all ${deals.length} shops`}
        </Button>
      )}
    </>
  );
}
