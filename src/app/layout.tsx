import type { Metadata, Viewport } from "next";
import { Providers } from "@/components/Providers";
import { fontVariables } from "./fonts";
import "@/styles/tokens.css";
import "@/styles/global.css";

export const metadata: Metadata = {
  title: { default: "Shelfmark", template: "%s | Shelfmark" },
  description: "A personal catalogue of games.",
};

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#1a1917",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={fontVariables} data-direction="editorial">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
