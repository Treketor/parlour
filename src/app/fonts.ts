import { Libre_Franklin, Schibsted_Grotesk, Source_Serif_4 } from "next/font/google";

// Variable fonts, so no weights are listed; opsz lets display sizes use the tighter cut.
export const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  axes: ["opsz"],
  style: ["normal", "italic"],
  variable: "--font-source-serif",
  display: "swap",
});

export const libreFranklin = Libre_Franklin({
  subsets: ["latin"],
  variable: "--font-libre-franklin",
  display: "swap",
});

export const schibstedGrotesk = Schibsted_Grotesk({
  subsets: ["latin"],
  variable: "--font-schibsted",
  display: "swap",
});

export const fontVariables = [sourceSerif, libreFranklin, schibstedGrotesk]
  .map((font) => font.variable)
  .join(" ");
