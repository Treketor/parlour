import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shelfmark",
  description: "A personal catalogue of games.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
