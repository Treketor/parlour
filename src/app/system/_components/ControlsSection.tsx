"use client";

import { useState } from "react";
import { Button, IconButton, type ButtonVariant } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { MenuSelect } from "@/components/ui/MenuSelect";
import { ProgressGlyph, ProgressLabel } from "@/components/ui/ProgressGlyph";
import { RatingInput } from "@/components/ui/RatingInput";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Select } from "@/components/ui/Select";
import { Tag } from "@/components/ui/Tag";
import { TextField } from "@/components/ui/TextField";
import { CloseIcon, PlusIcon, SearchIcon } from "@/components/ui/icons";
import { PROGRESS_STATES, progressDescription, progressLabel, type Progress } from "@/lib/progress";
import type { Rating } from "@/lib/rating";
import styles from "../system.module.css";
import { Section } from "./Section";

const variants: Array<{ variant: ButtonVariant; label: string; action: string }> = [
  { variant: "primary", label: "Primary", action: "Add to library" },
  { variant: "secondary", label: "Secondary", action: "Add to queue" },
  { variant: "quiet", label: "Quiet", action: "Edit notes" },
  { variant: "danger", label: "Danger", action: "Remove from library" },
];

function ButtonMatrix() {
  const [saving, setSaving] = useState(false);

  return (
    <div className={styles.matrixScroll}>
      <table className={styles.matrix}>
        <thead>
          <tr>
            <th scope="col">
              <span className="visually-hidden">Variant</span>
            </th>
            <th scope="col">Default</th>
            <th scope="col">Small</th>
            <th scope="col">Loading</th>
            <th scope="col">Disabled</th>
          </tr>
        </thead>
        <tbody>
          {variants.map(({ variant, label, action }) => (
            <tr key={variant}>
              <th scope="row">{label}</th>
              <td>
                <Button variant={variant}>{action}</Button>
              </td>
              <td>
                <Button variant={variant} size="sm">
                  {action}
                </Button>
              </td>
              <td>
                <Button variant={variant} loading>
                  {action}
                </Button>
              </td>
              <td>
                <Button variant={variant} disabled>
                  {action}
                </Button>
              </td>
            </tr>
          ))}
          <tr>
            <th scope="row">Icon</th>
            <td>
              <Button icon={<PlusIcon />}>Add tag</Button>
            </td>
            <td>
              <IconButton label="Close" size="sm" variant="quiet">
                <CloseIcon />
              </IconButton>
            </td>
            <td>
              <Button
                variant="primary"
                loading={saving}
                onClick={() => {
                  setSaving(true);
                  window.setTimeout(() => setSaving(false), 1400);
                }}
              >
                Press to save
              </Button>
            </td>
            <td>
              <IconButton label="Search" disabled>
                <SearchIcon />
              </IconButton>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

const progressOptions = PROGRESS_STATES.map((state) => ({
  value: state,
  label: progressLabel[state],
  description: progressDescription[state],
  leading: <ProgressGlyph progress={state} />,
}));

export function ControlsSection() {
  const [query, setQuery] = useState("obra dinn");
  const [notes, setNotes] = useState("");
  const [platform, setPlatform] = useState("pc");
  const [view, setView] = useState<"list" | "grid">("list");
  const [progress, setProgress] = useState<Progress | null>("playing");
  const [emptyProgress, setEmptyProgress] = useState<Progress | null>(null);
  const [rating, setRating] = useState<Rating | null>(8);
  const [unrated, setUnrated] = useState<Rating | null>(null);
  const [filters, setFilters] = useState<Set<string>>(new Set(["Owned"]));
  const [tags, setTags] = useState(["Want to complete", "Co-op", "Comfort game"]);
  const [owned, setOwned] = useState(true);

  function toggleFilter(name: string) {
    setFilters((current) => {
      const next = new Set(current);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  return (
    <Section
      id="controls"
      title="Controls"
      intro="Every control registers a press on pointer-down, shows focus only for keyboard use, and has designed disabled, loading and error states. Hover, press and focus are live: try them with a mouse, a finger and the Tab key."
    >
      <div className={styles.group}>
        <h3 className={styles.subhead}>Buttons</h3>
        <ButtonMatrix />
      </div>

      <div className={styles.group}>
        <h3 className={styles.subhead}>Text and choice</h3>
        <TextField
          className={styles.searchDemo}
          label="Search games"
          hideLabel
          placeholder="Search games"
          leading={<SearchIcon />}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onClear={() => setQuery("")}
          type="search"
        />
        <div className={styles.controlGrid}>
          <TextField
            label="Hours played"
            hint="Whole hours. Leave empty if you did not track it."
            inputMode="numeric"
            placeholder="0"
          />
          <TextField
            label="Hours played"
            defaultValue="twelve"
            error="Enter a whole number, like 12."
            inputMode="numeric"
          />
          <TextField
            label="Title"
            defaultValue="Outer Wilds"
            disabled
            hint="Titles come from IGDB."
          />
          <Select
            label="Platform"
            value={platform}
            onChange={(event) => setPlatform(event.target.value)}
          >
            <option value="pc">PC</option>
            <option value="ps5">PlayStation 5</option>
            <option value="switch">Nintendo Switch</option>
            <option value="xsx">Xbox Series X|S</option>
          </Select>
          <Select label="Region" defaultValue="" error="Choose a region to see prices.">
            <option value="" disabled>
              Choose a region
            </option>
            <option value="gb">United Kingdom</option>
            <option value="us">United States</option>
          </Select>
          <TextField
            label="Notes"
            placeholder="What stuck with you?"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
          <div className={styles.checkboxes}>
            <Checkbox checked={owned} onChange={(event) => setOwned(event.target.checked)}>
              Owned on this platform
            </Checkbox>
            <Checkbox defaultChecked={false}>Show abandoned games</Checkbox>
            <Checkbox disabled defaultChecked>
              Synced from Steam
            </Checkbox>
            <Checkbox aria-invalid="true">Accept the terms</Checkbox>
          </div>
        </div>
      </div>

      <div className={styles.group}>
        <h3 className={styles.subhead}>Selection</h3>
        <div className={styles.stack}>
          <div className={styles.inlineRow}>
            <SegmentedControl
              label="View"
              value={view}
              onChange={setView}
              options={[
                { value: "list", label: "List" },
                { value: "grid", label: "Grid" },
              ]}
            />
            <MenuSelect
              label="Progress"
              options={progressOptions}
              value={progress}
              onChange={setProgress}
            />
            <MenuSelect
              label="Progress"
              placeholder="Set progress"
              options={progressOptions}
              value={emptyProgress}
              onChange={setEmptyProgress}
            />
            <MenuSelect
              label="Progress"
              options={progressOptions}
              value="finished"
              onChange={() => {}}
              disabled
            />
          </div>

          <div className={styles.inlineRow}>
            {["Owned", "Want to own", "Not interested"].map((name) => (
              <Tag key={name} selected={filters.has(name)} onToggle={() => toggleFilter(name)}>
                {name}
              </Tag>
            ))}
            <Tag onToggle={() => {}} disabled>
              Wishlisted
            </Tag>
          </div>

          <div className={styles.inlineRow}>
            {tags.map((tag) => (
              <Tag
                key={tag}
                onRemove={() => setTags((current) => current.filter((item) => item !== tag))}
              >
                {tag}
              </Tag>
            ))}
            {tags.length === 0 && (
              <Button
                size="sm"
                variant="quiet"
                onClick={() => setTags(["Want to complete", "Co-op", "Comfort game"])}
              >
                Restore tags
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className={styles.group}>
        <h3 className={styles.subhead}>Rating</h3>
        <div className={styles.stack}>
          <RatingInput label="Your rating" value={rating} onChange={setRating} />
          <RatingInput label="Your rating" value={unrated} onChange={setUnrated} />
          <RatingInput label="Your rating" value={6} onChange={() => {}} disabled />
          <RatingInput
            label="Your rating"
            value={null}
            onChange={() => {}}
            error="Could not save your rating. Check your connection and try again."
          />
        </div>
      </div>

      <div className={styles.group}>
        <h3 className={styles.subhead}>Progress</h3>
        <dl className={styles.progressLegend}>
          {PROGRESS_STATES.map((state) => (
            <div key={state} className={styles.progressItem}>
              <dt>
                <ProgressLabel progress={state} />
              </dt>
              <dd>{progressDescription[state]}</dd>
            </div>
          ))}
        </dl>
      </div>
    </Section>
  );
}
