import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import type { ReactNode } from "react";
import "./globals.css";
import { site, siteMeta } from "@/lib/site";

const literata = localFont({
  src: "../fonts/literata-var.woff2",
  variable: "--font-literata",
  weight: "400 700",
  style: "normal",
  display: "swap",
  preload: true,
  fallback: ["Georgia", "Times New Roman", "serif"],
});

const golos = localFont({
  src: "../fonts/golos-text-var.woff2",
  variable: "--font-golos",
  weight: "400 700",
  style: "normal",
  display: "swap",
  preload: true,
  fallback: ["Segoe UI", "Helvetica Neue", "Arial", "sans-serif"],
});

const caveat = localFont({
  src: "../fonts/caveat-var.woff2",
  variable: "--font-caveat",
  weight: "400",
  style: "normal",
  display: "swap",
  preload: false,
  fallback: ["Segoe Script", "Bradley Hand", "cursive"],
});

export const metadata: Metadata = {
  title: siteMeta.title,
  description: siteMeta.description,
  applicationName: site.name,
};

export const viewport: Viewport = {
  themeColor: "#f6f1e7",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru" className={`${literata.variable} ${golos.variable} ${caveat.variable}`}>
      <body>
        <a className="skip-link" href="#main">
          Перейти к содержимому
        </a>
        {children}
      </body>
    </html>
  );
}
