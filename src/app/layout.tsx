import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MarketPOS Admin",
  description: "Market POS Admin Portal",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}