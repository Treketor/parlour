import type { ReactNode, SVGProps } from "react";

/*
 * Drawn for this project on a 16px grid, 1.5px strokes with square ends so they
 * sit with the sharp-cornered controls. Decorative by default; the control that
 * holds an icon is responsible for its accessible name.
 */

type IconProps = Omit<SVGProps<SVGSVGElement>, "children">;

function Icon({ children, ...props }: IconProps & { children: ReactNode }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="square"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="7" cy="7" r="4.25" />
      <path d="M10.25 10.25 13.5 13.5" />
    </Icon>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 4l8 8M12 4l-8 8" />
    </Icon>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4.5 6.5 8 10l3.5-3.5" />
    </Icon>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3.5 8.5 6.5 11.5 12.5 4.5" />
    </Icon>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M8 3.5v9M3.5 8h9" />
    </Icon>
  );
}

/** Sort direction: a single stroke that reads as an up or down tick. */
export function SortIcon({ direction, ...props }: IconProps & { direction: "asc" | "desc" }) {
  return (
    <Icon {...props}>
      {direction === "asc" ? <path d="M5 9.5 8 6.5l3 3" /> : <path d="M5 6.5 8 9.5l3-3" />}
    </Icon>
  );
}

/** Filters: three rules narrowing downwards, the way a list is narrowed. */
export function FilterIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3 4.5h10M5 8h6M7 11.5h2" />
    </Icon>
  );
}
