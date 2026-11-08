import type { Metadata, Viewport } from "next";
import { Source_Serif_4 } from "next/font/google";
import "./globals.css";
import { CONTACT } from "@/components/landing/data";

// One variable family for headings + body; the opsz axis gives display cuts at large sizes.
const serif = Source_Serif_4({
  variable: "--font-serif",
  subsets: ["latin", "latin-ext", "cyrillic", "cyrillic-ext"],
  axes: ["opsz"],
});

export const viewport: Viewport = { themeColor: "#e6e0d4" };

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
      className={`${serif.variable} antialiased`}
      suppressHydrationWarning
    >
      <body suppressHydrationWarning>
        {/* motion gate: hidden initial states in globals.css only apply once this runs */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('mo')" }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}
