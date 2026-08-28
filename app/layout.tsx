// Shell: Poppins + Simplycure catalog colors, both screens.

import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

const sans = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Dossier patient · Simplycure",
  description: "Prototype dossier + note-taker — données 100% fictives",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={`${sans.variable} ${sans.className}`}>{children}</body>
    </html>
  );
}
