import { Skeleton } from "@/components/ui/Skeleton";
import { ExternalIcon } from "@/components/ui/icons";
import type { GameDetail } from "@/lib/game-detail";
import { checkedAgo, priceChart } from "@/lib/price-chart";
import {
  PRICE_REGIONS,
  formatMoney,
  type Deal,
  type PriceData,
  type PriceRegion,
} from "@/lib/prices";
import { formatDate } from "@/lib/format";
import { getPriceService } from "@/server/prices";
import { priceRegion } from "@/server/prices/region";
import { DealList, type DealRow } from "./DealList";
import { RegionPicker } from "./RegionPicker";
import styles from "./game.module.css";

/** IGDB platform ids for Windows, Mac and Linux: the platforms IsThereAnyDeal's shops sell for. */
const PC_PLATFORMS = new Set([6, 14, 3]);

const CHART = { width: 600, height: 120 };

/** How old the prices on show are, as of this request. */
function freshness(fetchedAt: string): string {
  return checkedAgo(fetchedAt, Date.now());
}

const regionNames = new Intl.DisplayNames(["en-GB"], { type: "region" });
const regionName = (region: string) => regionNames.of(region) ?? region;

/**
 * What the game costs now in your region, the lowest it has been, and how
 * its price has moved over the past year, from IsThereAnyDeal
 * (DECISIONS.md 045). Streams in after the rest of the page. Left out
 * entirely when no ITAD key is configured.
 */
export async function GamePrices({ game }: { game: GameDetail }) {
  const service = getPriceService();
  if (!service) return null;

  const region = await priceRegion();
  const result = await service
    .pricesFor(
      {
        id: game.id,
        name: game.name,
        onPc: game.platforms.some((platform) => PC_PLATFORMS.has(platform.id)),
        steamAppIds: game.externalIds.filter((id) => id.source === "steam").map((id) => id.uid),
      },
      region,
    )
    .catch((error: unknown) => {
      console.error("Prices could not be read", error);
      return { status: "unavailable" as const };
    });

  const options = [...PRICE_REGIONS]
    .map((code) => ({ value: code, label: regionName(code) }))
    .sort((a, b) => a.label.localeCompare(b.label));

  return (
    <section className={styles.section} aria-labelledby="prices">
      <div className={styles.sectionHead}>
        <h2 id="prices" className={styles.sectionTitle}>
          Prices
        </h2>
        {result.status !== "not-on-pc" && <RegionPicker region={region} options={options} />}
      </div>

      {result.status === "not-on-pc" && (
        <p className={styles.priceNote}>
          IsThereAnyDeal follows PC shops, and this game is not sold for PC.
        </p>
      )}
      {result.status === "untracked" && (
        <p className={styles.priceNote}>IsThereAnyDeal has no prices for this game.</p>
      )}
      {result.status === "unavailable" && (
        <p className={styles.priceNote}>
          Prices could not be loaded just now. They will be tried again on your next visit.
        </p>
      )}
      {result.status === "ok" &&
        (result.data && result.data.deals.length > 0 ? (
          <PriceDetails data={result.data} region={region} fetchedAt={result.fetchedAt} />
        ) : (
          <p className={styles.priceNote}>No shop sells it in {regionName(region)} right now.</p>
        ))}

      {result.status === "ok" && (
        <p className={styles.priceCredit}>
          Prices from{" "}
          <a
            href="https://isthereanydeal.com"
            target="_blank"
            rel="noopener"
            className={styles.scoreLink}
          >
            IsThereAnyDeal
            <ExternalIcon width={12} height={12} />
            <span className="visually-hidden">(opens in a new tab)</span>
          </a>
          . Shop links go through IsThereAnyDeal and may carry its affiliate tags.{" "}
          {freshness(result.fetchedAt)}.
        </p>
      )}
    </section>
  );
}

type PriceDetailsProps = { data: PriceData; region: PriceRegion; fetchedAt: string };

function PriceDetails({ data, region, fetchedAt }: PriceDetailsProps) {
  const best = data.deals[0];
  if (!best) return null;
  const chart = priceChart(data.history, fetchedAt, CHART);

  return (
    <div className={styles.prices}>
      <div className={styles.bestPrice}>
        <p className={styles.bestValue}>{formatMoney(best.price)}</p>
        <p className={styles.bestShop}>
          {best.cut > 0 ? `${best.cut}% off at ${best.shop}` : `At ${best.shop}`}
          {best.cut > 0 && (
            <span className={styles.bestRegular}> (usually {formatMoney(best.regular)})</span>
          )}
        </p>
        <dl className={styles.lows}>
          {data.lowest.allTime && (
            <div>
              <dt>Lowest ever</dt>
              <dd>{formatMoney(data.lowest.allTime)}</dd>
            </div>
          )}
          {data.lowest.pastYear && (
            <div>
              <dt>Lowest this year</dt>
              <dd>{formatMoney(data.lowest.pastYear)}</dd>
            </div>
          )}
        </dl>
      </div>

      {chart && (
        <figure className={styles.priceChart}>
          <svg
            viewBox={`0 0 ${CHART.width} ${CHART.height}`}
            preserveAspectRatio="none"
            role="img"
            aria-label={`The cheapest price in ${regionName(region)} over the past year ranged from ${formatMoney({ amount: chart.low, currency: data.currency })} to ${formatMoney({ amount: chart.high, currency: data.currency })}.`}
          >
            <path d={chart.path} className={styles.priceLine} vectorEffect="non-scaling-stroke" />
          </svg>
          <figcaption className={styles.chartAxis}>
            <span>{formatDate(new Date(chart.from))}</span>
            <span>
              Cheapest price over time,{" "}
              {formatMoney({ amount: chart.low, currency: data.currency })} to{" "}
              {formatMoney({ amount: chart.high, currency: data.currency })}
            </span>
            <span>Today</span>
          </figcaption>
        </figure>
      )}

      <DealList deals={data.deals.map(toRow)} />
    </div>
  );
}

function toRow(deal: Deal): DealRow {
  // A key shop selling a Steam key says so; a shop delivering its own copy needs no note.
  const foreign = deal.drm.filter((drm) => drm !== deal.shop);
  return {
    shop: deal.shop,
    price: formatMoney(deal.price),
    regular: deal.cut > 0 ? formatMoney(deal.regular) : null,
    cut: deal.cut,
    delivery: foreign.length > 0 ? `${foreign.join(", ")} key` : null,
    voucher: deal.voucher,
    url: deal.url,
  };
}

/** The section's frame while prices load. */
export function GamePricesSkeleton() {
  if (!getPriceService()) return null;
  return (
    <div className={styles.section} aria-busy="true" aria-label="Loading prices">
      <div className={styles.sectionHead}>
        <p className={styles.sectionTitle}>Prices</p>
      </div>
      <div className={styles.skeletonBlock}>
        <Skeleton />
      </div>
    </div>
  );
}
