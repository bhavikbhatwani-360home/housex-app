import type { Metadata, Viewport } from "next";
import { Inter, Noto_Sans_Devanagari, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const deva = Noto_Sans_Devanagari({
  variable: "--font-deva",
  subsets: ["devanagari"],
  weight: ["600", "700"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["500"],
});

export const metadata: Metadata = {
  title: "HouseX — Talk to Baba",
  description:
    "Stop scrolling listings. Just talk to Baba. AI-powered home search for India.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/assets/housex-icon-circle.png",
    apple: "/assets/icon-192.png",
  },
  appleWebApp: {
    capable: true,
    title: "HouseX",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#E03943",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${deva.variable} ${jetbrains.variable} h-full antialiased`}
    >
      <body className="font-sans min-h-full">{children}</body>
    </html>
  );
}
