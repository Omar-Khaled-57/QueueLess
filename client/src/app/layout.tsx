import type { Metadata } from "next";
import { Geist, Geist_Mono, Cairo } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { LanguageProvider } from "@/context/LanguageContext";

import ClientLayout from "@/components/ClientLayout";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["400", "600", "700", "900"],
});

const SITE_URL = "https://queue-less-nu.vercel.app";

export const metadata: Metadata = {
  title: {
    default: "QueueLess — Smart Queue & Appointment System",
    template: "%s | QueueLess",
  },
  description: "Eliminate physical waiting lines with a real-time digital queue system. Join remotely, track your turn live, and save hours of time.",
  keywords: ["queue management", "digital ticketing", "appointment scheduling", "real-time tracking", "smart queue"],
  authors: [{ name: "Omar Khaled" }],
  creator: "Omar Khaled",
  publisher: "QueueLess",
  metadataBase: new URL(SITE_URL),
  icons: {
    icon: "/webcon.png",
    apple: "/webcon.png",
  },
  openGraph: {
    title: "QueueLess — Smart Queue & Appointment System",
    description: "Replace physical waiting lines with a smart digital queue system. Book remotely and track your turn in real-time.",
    url: SITE_URL,
    siteName: "QueueLess",
    images: [
      {
        url: "/page.png",
        width: 1200,
        height: 630,
        alt: "QueueLess Dashboard Preview",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "QueueLess — Smart Queue & Appointment System",
    description: "Eliminate physical waiting lines with real-time digital queuing.",
    images: ["/page.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    languages: {
      en: SITE_URL,
      ar: SITE_URL,
      "x-default": SITE_URL,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${cairo.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col font-sans" suppressHydrationWarning>
        <LanguageProvider>
          <ThemeProvider>
            <AuthProvider>
              <ClientLayout>
                {children}
              </ClientLayout>
            </AuthProvider>
          </ThemeProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}

