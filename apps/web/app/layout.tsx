import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import { COMPANY, SITE_URL } from "@/content/site";
import { MobileContactBar } from "@/components/home/ContactCta";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${COMPANY.brandName} | Chauffeur airport transfers from Canary Wharf`,
    template: `%s | ${COMPANY.brandName}`,
  },
  description:
    "Pre-booked chauffeur airport transfers from Canary Wharf (E14) to Heathrow and Gatwick. A fixed, all-in fare calculated in seconds, flight tracking and 60 minutes free waiting.",
  alternates: { canonical: "/" },
  icons: { icon: "/brand/logo-mark.png" },
  openGraph: {
    type: "website",
    locale: "en_GB",
    siteName: COMPANY.brandName,
  },
};

export const viewport: Viewport = {
  themeColor: "#050505",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" className={`${inter.variable} ${cormorant.variable}`}>
      <body>
        {children}
        <MobileContactBar />
      </body>
    </html>
  );
}
