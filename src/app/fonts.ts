import { Public_Sans, Schibsted_Grotesk, Source_Serif_4 } from "next/font/google";

// Variable fonts, so no weights are listed; opsz lets display sizes use the tighter cut.
export const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  axes: ["opsz"],
  style: ["normal", "italic"],
  variable: "--font-source-serif",
  display: "swap",
});

export const publicSans = Public_Sans({
  subsets: ["latin"],
  variable: "--font-public-sans",
  display: "swap",
});

export const schibstedGrotesk = Schibsted_Grotesk({
  subsets: ["latin"],
  variable: "--font-schibsted",
  display: "swap",
});

export const fontVariables = [sourceSerif, publicSans, schibstedGrotesk]
  .map((font) => font.variable)
  .join(" ");
