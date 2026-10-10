import type { Metadata } from "next";
import { Cormorant_Garamond, Lora } from "next/font/google";
import "./globals.css";
import { CONTACT } from "@/components/landing/data";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  weight: ["400", "600"],
  subsets: ["latin", "cyrillic"],
});

const lora = Lora({
  variable: "--font-lora",
  weight: ["400", "600"],
  subsets: ["latin", "cyrillic"],
});

const SITE_URL = "https://whitegroup.mn";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Вайт грүпп ХХК — Дорнод аймгийн махны үйлдвэр | White Group",
  description:
    "“Вайт грүпп” (White Group, Вайтгрүп) ХХК — Дорнод аймгийн махны үйлдвэр. 2008 оноос хойш Дорнод, Сүхбаатар нутгаас мал, мах, махан бүтээгдэхүүн бэлтгэн дотоодын зах зээл болон экспортын үйлдвэрүүдэд нийлүүлж байна. HACCP, HALAL, ISO 9001:2016.",
  keywords: [
    "Дорнод мах",
    "Дорнод махны үйлдвэр",
    "махны үйлдвэр",
    "Вайт грүпп",
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
    siteName: "Вайт грүпп ХХК",
    title: "Вайт грүпп ХХК — Дорнод аймгийн махны үйлдвэр | White Group",
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
  name: "Вайт грүпп ХХК",
  alternateName: ["White Group", "WhiteGroup", "Вайтгрүп", "Вайт грүпп"],
  url: SITE_URL,
  logo: `${SITE_URL}/brand/mark-dark.png`,
  image: `${SITE_URL}/brand/logo-dark.png`,
  description:
    "Дорнод аймгийн махны үйлдвэр. Мал, мах, махан бүтээгдэхүүн бэлтгэн нийлүүлэгч.",
  foundingDate: "2008",
  telephone: CONTACT.phone,
  email: CONTACT.email,
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
      className={`${cormorant.variable} ${lora.variable} antialiased`}
      suppressHydrationWarning
    >
      <body suppressHydrationWarning>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}
