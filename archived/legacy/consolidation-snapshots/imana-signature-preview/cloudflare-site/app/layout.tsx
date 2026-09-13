import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Administration — IMANA Signature",
  description: "Portail privé de pilotage de la boutique IMANA Signature.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
