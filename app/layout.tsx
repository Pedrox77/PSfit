import type { Metadata, Viewport } from "next";
import {
  Geist,
  Instrument_Serif,
  Space_Grotesk,
} from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
});

const space = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space",
});

const instrument = Instrument_Serif({
  weight: "400",
  style: "italic",
  subsets: ["latin"],
  variable: "--font-instrument",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://psfit.app"),

  title: {
    default: "PSFIT — Treino, nutrição e evolução em um só lugar",
    template: "%s | PSFIT",
  },

  description:
    "Organize seus treinos, acompanhe sua alimentação, recuperação e progresso com o PSFIT.",

  openGraph: {
    title: "PSFIT — Treino, nutrição e evolução em um só lugar",
    description:
      "Organize seus treinos, acompanhe sua alimentação, recuperação e progresso com o PSFIT.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PSFIT — Treino, nutrição e evolução em um só lugar",
    description: "Organize seus treinos, acompanhe sua alimentação, recuperação e progresso com o PSFIT.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#030504",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();

  return (
    <html lang={locale === "pt" ? "pt-BR" : locale}>
      <body
        className={`${geist.variable} ${space.variable} ${instrument.variable}`}
      >
        <NextIntlClientProvider>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
