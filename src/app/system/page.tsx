import type { Metadata } from "next";
import { CatalogueSection } from "./_components/CatalogueSection";
import { ControlsSection } from "./_components/ControlsSection";
import { ColourSection, SpaceSection, TypeSection } from "./_components/FoundationSections";
import { MotionSection } from "./_components/MotionSection";
import { ReviewControls } from "./_components/ReviewControls";
import styles from "./system.module.css";

export const metadata: Metadata = {
  title: "Design system",
};

const sections = [
  { id: "colour", label: "Colour" },
  { id: "type", label: "Type" },
  { id: "space", label: "Space" },
  { id: "motion", label: "Motion" },
  { id: "controls", label: "Controls" },
  { id: "catalogue", label: "Catalogue" },
];

export default function SystemPage() {
  return (
    <>
      <div className={styles.intro}>
        <h1 className={styles.title}>Design system</h1>
        <p className={styles.lead}>
          The tokens, components and motion every screen is built from. If something on a later
          screen is not on this page, it should be added here first.
        </p>
        <ReviewControls />
      </div>

      <div className={styles.body}>
        <nav className={styles.index} aria-label="Sections">
          <ol>
            {sections.map((section) => (
              <li key={section.id}>
                <a href={`#${section.id}`}>{section.label}</a>
              </li>
            ))}
          </ol>
        </nav>

        <div className={styles.sections}>
          <ColourSection />
          <TypeSection />
          <SpaceSection />
          <MotionSection />
          <ControlsSection />
          <CatalogueSection />
        </div>
      </div>
    </>
  );
}
