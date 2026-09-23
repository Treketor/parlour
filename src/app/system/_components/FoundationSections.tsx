import type { CSSProperties } from "react";
import styles from "../system.module.css";
import { Section } from "./Section";

type Swatch = { token: string; role: string; contrast?: string };

const grounds: Swatch[] = [
  { token: "canvas", role: "Page" },
  { token: "surface", role: "Menus, row hover" },
  { token: "surface-raised", role: "Control hover, empty art" },
  { token: "surface-pressed", role: "Pressed fills" },
  { token: "line", role: "Hairline dividers" },
  { token: "line-strong", role: "Tag edges, empty states" },
  { token: "control-line", role: "Input and control edges", contrast: "3.3" },
];

const inks: Swatch[] = [
  { token: "text", role: "Titles, values", contrast: "14.0" },
  { token: "text-muted", role: "Secondary text, labels", contrast: "8.7" },
  { token: "text-faint", role: "Metadata, placeholders", contrast: "6.0" },
  { token: "accent", role: "Selected, current, focus, primary action", contrast: "8.5" },
  { token: "danger", role: "Errors only", contrast: "7.0" },
];

function SwatchList({ swatches }: { swatches: Swatch[] }) {
  return (
    <dl className={styles.swatches}>
      {swatches.map((swatch) => (
        <div key={swatch.token} className={styles.swatch}>
          <span
            className={styles.chip}
            style={{ "--chip": `var(--color-${swatch.token})` } as CSSProperties}
            aria-hidden="true"
          />
          <dt className={styles.swatchName}>{swatch.token}</dt>
          <dd className={styles.swatchRole}>{swatch.role}</dd>
          <dd className={styles.swatchContrast}>
            {swatch.contrast ? (
              <>
                {swatch.contrast}
                <span className={styles.unit}>:1</span>
              </>
            ) : null}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function ColourSection() {
  return (
    <Section
      id="colour"
      title="Colour"
      intro="A warm near-black ground. Surfaces step up in lightness instead of casting shadows. One accent, used only for what is selected, current or focused, and for the primary action. Contrast is measured against the canvas."
    >
      <div className={styles.twoUp}>
        <div>
          <h3 className={styles.subhead}>Grounds and edges</h3>
          <SwatchList swatches={grounds} />
        </div>
        <div>
          <h3 className={styles.subhead}>Ink</h3>
          <SwatchList swatches={inks} />
        </div>
      </div>
    </Section>
  );
}

const typeSteps = [
  {
    token: "display",
    px: 52,
    sample: "Return of the Obra Dinn",
    role: "Page titles",
    display: true,
  },
  { token: "3xl", px: 40, sample: "Disco Elysium", role: "Game title on its page", display: true },
  { token: "2xl", px: 32, sample: "Library", role: "Section titles", display: true },
  { token: "xl", px: 25, sample: "Currently playing", role: "Group headings", display: true },
  {
    token: "lg",
    px: 20,
    sample: "Prices in United Kingdom",
    role: "Panel headings",
    display: true,
  },
  { token: "md", px: 17, sample: "Released 22 January 2019", role: "Lead text" },
  { token: "base", px: 15, sample: "Outer Wilds, PC, finished", role: "Interface default" },
  { token: "sm", px: 14, sample: "Sort by date added", role: "Controls, table cells" },
  { token: "xs", px: 13, sample: "Added 2 Nov 2025", role: "Metadata, labels" },
  { token: "2xs", px: 12, sample: "Data from IGDB", role: "Attributions, footnotes" },
] as const;

export function TypeSection() {
  return (
    <Section
      id="type"
      title="Type"
      intro="One grotesk, Schibsted Grotesk, at every size. Hierarchy comes from size, weight and tracking: display sizes are bold and tightly set, interface text is regular. Numbers that stack in columns use tabular figures so they line up."
    >
      <div className={styles.typeScale}>
        {typeSteps.map((step) => (
          <div key={step.token} className={styles.typeRow}>
            <span className={styles.typeMeta}>
              <span className={styles.typeToken}>{step.token}</span>
              <span className={styles.typePx}>{step.px}</span>
            </span>
            <span
              className={"display" in step ? styles.typeSampleDisplay : styles.typeSample}
              style={{ fontSize: `var(--text-${step.token})` }}
            >
              {step.sample}
            </span>
            <span className={styles.typeRole}>{step.role}</span>
          </div>
        ))}
      </div>

      <div className={styles.twoUp}>
        <div>
          <h3 className={styles.subhead}>Reading text</h3>
          <p className={styles.reading}>
            Picked this up again after the Echoes of the Eye expansion. The first twenty minutes of
            the loop are still the best opening I have played: no tutorial, no objective, just a
            campfire and a telescope pointed at something you do not understand yet. Finished it in
            four evenings. Worth playing blind, with the sound up.
          </p>
          <p className={styles.caption}>
            Notes and descriptions: 15px, 1.5 line height, 68 character measure.
          </p>
        </div>
        <div>
          <h3 className={styles.subhead}>Tabular figures</h3>
          <table className={styles.figures}>
            <thead>
              <tr>
                <th scope="col">Store</th>
                <th scope="col">Price</th>
                <th scope="col">Low</th>
                <th scope="col">Checked</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Steam</td>
                <td>£19.49</td>
                <td>£9.74</td>
                <td>21 Sep 2026</td>
              </tr>
              <tr>
                <td>GOG</td>
                <td>£11.69</td>
                <td>£7.79</td>
                <td>22 Sep 2026</td>
              </tr>
              <tr>
                <td>Humble</td>
                <td>£19.49</td>
                <td>£11.11</td>
                <td>18 Sep 2026</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </Section>
  );
}

const spaceSteps = ["1", "2", "3", "4", "5", "6", "8", "10", "12", "16", "20"];

export function SpaceSection() {
  return (
    <Section
      id="space"
      title="Space"
      intro="A 4px base. The number in each name counts 4px units, so space-6 is 24px. Dense by default: rows sit on 8 and 12, sections separate on 48 and 64."
    >
      <div className={styles.spaceScale}>
        {spaceSteps.map((step) => (
          <div key={step} className={styles.spaceRow}>
            <span className={styles.typeToken}>space-{step}</span>
            <span className={styles.typePx}>{Number(step) * 4}</span>
            <span
              className={styles.spaceBar}
              style={{ "--size": `var(--space-${step})` } as CSSProperties}
              aria-hidden="true"
            />
          </div>
        ))}
      </div>
    </Section>
  );
}
