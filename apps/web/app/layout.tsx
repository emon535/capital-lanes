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
    default: `${COMPANY.brandName} | Private executive transfers in London`,
    template: `%s | ${COMPANY.brandName}`,
  },
  description:
    "Private executive transfers and chauffeur-driven airport journeys across London, from saloon to S-Class and 7-seater MPV. A fixed, all-in fare, invoices for business clients and 20% off your first ride.",
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
