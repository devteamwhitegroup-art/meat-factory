import type { Metadata } from "next";
import { Geist, Manrope } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "cyrillic"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "cyrillic"],
});

const SITE_URL = "https://whitegroup.mn";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Вайт групп ХХК — Дорнод аймгийн махны үйлдвэр | White Group",
  description:
    "“Вайт групп” (White Group, Вайтгрүп) ХХК — Дорнод аймгийн махны үйлдвэр. 2008 оноос хойш Дорнод, Сүхбаатар нутгаас мал, мах, махан бүтээгдэхүүн бэлтгэн дотоодын зах зээл болон экспортын үйлдвэрүүдэд нийлүүлж байна. HACCP, HALAL, ISO 9001:2016.",
  keywords: [
    "Дорнод мах",
    "Дорнод махны үйлдвэр",
    "махны үйлдвэр",
    "Вайт групп",
    "Вайтгрүп",
    "White Group",
    "WhiteGroup",
    "мах",
    "махан бүтээгдэхүүн",
    "Чойбалсан мах",
  ],
  alternates: { canonical: SITE_URL },
  openGraph: {
    type: "website",
    locale: "mn_MN",
    url: SITE_URL,
    siteName: "Вайт групп ХХК",
    title: "Вайт групп ХХК — Дорнод аймгийн махны үйлдвэр | White Group",
    description:
      "Дорнод аймгийн махны үйлдвэр. Мал, мах, махан бүтээгдэхүүний найдвартай нийлүүлэгч. HACCP, HALAL, ISO 9001:2016.",
    images: ["/brand/logo-dark.png"],
  },
  robots: { index: true, follow: true },
};

// LocalBusiness structured data — main lever for local "дорнод мах" / brand-name
// queries. alternateName covers every spelling the user wants to rank for.
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "Вайт групп ХХК",
  alternateName: ["White Group", "WhiteGroup", "Вайтгрүп", "Вайт групп"],
  url: SITE_URL,
  logo: `${SITE_URL}/brand/mark-dark.png`,
  image: `${SITE_URL}/brand/logo-dark.png`,
  description:
    "Дорнод аймгийн махны үйлдвэр. Мал, мах, махан бүтээгдэхүүн бэлтгэн нийлүүлэгч.",
  foundingDate: "2008",
  slogan: "Мал, мах, махан бүтээгдэхүүний найдвартай нийлүүлэгч",
  address: {
    "@type": "PostalAddress",
    addressRegion: "Дорнод аймаг",
    addressLocality: "Чойбалсан",
    streetAddress: "Чойбалсангаас зүүн 12 км",
    addressCountry: "MN",
  },
  areaServed: "MN",
  knowsAbout: ["мах", "махан бүтээгдэхүүн", "махны үйлдвэр", "мал бэлтгэл"],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="mn"
      className={`${geist.variable} ${manrope.variable} antialiased`}
      suppressHydrationWarning
    >
      <body className="bg-brand-bg text-brand-ink" suppressHydrationWarning>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
        <Toaster richColors closeButton />
      </body>
    </html>
  );
}
