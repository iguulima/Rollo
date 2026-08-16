import type { Metadata, Viewport } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Rollo",
  description: "Sua watchlist, uma escolha por vez.",
};

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#0f1217",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className={dmSans.variable}>{children}</body>
    </html>
  );
}
