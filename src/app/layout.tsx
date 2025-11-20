import type { Metadata } from "next";
import { Rajdhani, Share_Tech_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
const rajdhani = Rajdhani({
  variable: "--font-rajdhani",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const shareTechMono = Share_Tech_Mono({
  variable: "--font-share-tech",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "J.A.R.V.I.S. HUD",
  description: "Advanced Holographic User Interface",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "J.A.R.V.I.S. HUD",
    description: "Advanced Holographic User Interface",
    url: "https://jarvis-hud-kappa.vercel.app/",
    siteName: "J.A.R.V.I.S. HUD",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "J.A.R.V.I.S. HUD",
    description: "Advanced Holographic User Interface",
    creator: "@suryansh777777",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${rajdhani.variable} ${shareTechMono.variable} antialiased bg-black overflow-hidden`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}
