import type { Metadata, Viewport } from "next";
import { Providers } from "@/components/Providers";
import { SiteFooter } from "@/components/shell/SiteFooter";
import { SiteHeader } from "@/components/shell/SiteHeader";
import { schibstedGrotesk } from "./fonts";
import styles from "./layout.module.css";
import "@/styles/tokens.css";
import "@/styles/global.css";

export const metadata: Metadata = {
  title: { default: "Parlour", template: "%s | Parlour" },
  description: "A catalogue of the games I own, have played and want to play next.",
};

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#1a1917",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={schibstedGrotesk.variable}>
      <body className={styles.body}>
        <Providers>
          <a href="#content" className={styles.skip}>
            Skip to content
          </a>
          <SiteHeader />
          <main id="content" className={styles.main} tabIndex={-1}>
            {children}
          </main>
          <SiteFooter />
        </Providers>
      </body>
    </html>
  );
}
