import type { Metadata } from "next";
import { Fraunces, Hanken_Grotesk, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WalletProvider } from "@/components/WalletProvider";

const fraunces = Fraunces({ subsets: ["latin"], weight: ["500", "700"], style: ["normal", "italic"], variable: "--font-display" });
const hanken = Hanken_Grotesk({ subsets: ["latin"], weight: ["400", "500", "700", "800"], variable: "--font-body" });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["500", "600"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "Verdikt — And the winner is provably fair",
  description: "Contest judging on-chain. Set the rubric, lock the prize, let validators score every entry.",
  openGraph: {
    title: "Verdikt — And the winner is provably fair",
    description: "Contest judging on-chain. Open record, validator consensus.",
    type: "website",
  },
};

function themeInitScript() {
  return `(function(){try{var t=localStorage.getItem("verdikt-theme");if(!t){t=window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark";}document.documentElement.setAttribute("data-theme",t);}catch(e){document.documentElement.setAttribute("data-theme","dark");}})();`;
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript() }} />
        <link rel="icon" href="/brand/logo-mark.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/brand/apple-touch-icon.png" />
        <link rel="manifest" href="/brand/manifest.webmanifest" />
      </head>
      <body className={`${fraunces.variable} ${hanken.variable} ${plexMono.variable}`}>
        <WalletProvider>
          <Header />
          <main>{children}</main>
          <Footer />
        </WalletProvider>
      </body>
    </html>
  );
}
