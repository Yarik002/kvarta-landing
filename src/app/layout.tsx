import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import type { ReactNode } from "react";
import "./globals.css";
import { SITE_URL, site, siteMeta } from "@/lib/site";

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
  preload: true,
  fallback: ["Segoe Script", "Bradley Hand", "cursive"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: siteMeta.title,
  description: siteMeta.description,
  applicationName: site.name,
  authors: [{ name: "РђРЅСЏ Рё Р”РјРёС‚СЂРёР№", url: SITE_URL }],
  creator: site.legalName,
  publisher: site.legalName,
  category: "food",
  keywords: [
    "РєРѕС„Рµ РњРёРЅСЃРє",
    "СЃРІРµР¶Р°СЏ РѕР±Р¶Р°СЂРєР°",
    "РєСЂР°С„С‚РѕРІР°СЏ РѕР±Р¶Р°СЂРєР°",
    "РєРѕС„Рµ РІ Р·С‘СЂРЅР°С… РњРёРЅСЃРє",
    "РїРѕРґРїРёСЃРєР° РЅР° РєРѕС„Рµ",
    "РљРІР°СЂС‚Р°",
    "СѓР». РљРѕСЂРѕР»СЏ 9",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: SITE_URL,
    siteName: site.name,
    title: siteMeta.title,
    description: siteMeta.description,
    images: [
      {
        url: "/og/kvarta-og.jpg",
        width: 1200,
        height: 630,
        alt: siteMeta.ogAlt,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteMeta.title,
    description: siteMeta.description,
    images: ["/og/kvarta-og.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  formatDetection: {
    telephone: true,
    address: true,
    email: true,
  },
  other: {
    "geo.region": "BY-HM",
    "geo.placename": "РњРёРЅСЃРє",
  },
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
          РџРµСЂРµР№С‚Рё Рє СЃРѕРґРµСЂР¶РёРјРѕРјСѓ
        </a>
        {children}
      </body>
    </html>
  );
}
