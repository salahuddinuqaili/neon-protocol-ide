import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Neon Protocol IDE",
  description: "Agentic Architectural Blueprint IDE",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Self-hosted — a desktop app must render correctly offline. Loading these from
            fonts.googleapis.com meant every icon fell back to its raw ligature text
            ("settings", "cloud_off") on any machine without a connection.
            Regenerate with `npm run build-fonts`. */}
        <link rel="stylesheet" href="/fonts/fonts.css" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
