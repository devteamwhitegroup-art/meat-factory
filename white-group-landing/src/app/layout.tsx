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

export const metadata: Metadata = {
  title: "Вайт групп ХХК — Мал, мах, махан бүтээгдэхүүний нийлүүлэгч",
  description:
    "“Вайт групп” ХХК — 2008 оноос хойш Дорнод, Сүхбаатар нутгаас мал, мах, малын гаралтай бүтээгдэхүүн бэлтгэн дотоодын зах зээл болон экспортын үйлдвэрүүдэд тогтвортой нийлүүлж байна. HACCP, HALAL, ISO 9001:2016.",
  icons: { icon: "/brand/mark-dark.png" },
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
        {children}
        <Toaster richColors closeButton />
      </body>
    </html>
  );
}
