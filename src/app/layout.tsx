import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://solutions.jkkn.ai'),
  title: {
    default: 'JKKN Solutions Hub',
    template: '%s | JKKN Solutions Hub',
  },
  description: 'Unified platform for tracking all JKKN solutions - software, training, and content. Leading Global Innovative Solutions Provider.',
  keywords: ['JKKN', 'solutions', 'software development', 'training', 'content creation', 'education', 'institution'],
  authors: [{ name: 'JKKN Institutions' }],
  creator: 'JKKN Institutions',
  publisher: 'J.K.K. Nattraja Educational Institutions',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://solutions.jkkn.ai',
    siteName: 'JKKN Solutions Hub',
    title: 'JKKN Solutions Hub',
    description: 'Unified platform for tracking all JKKN solutions - software, training, and content.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'JKKN Solutions Hub',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'JKKN Solutions Hub',
    description: 'Unified platform for tracking all JKKN solutions.',
    images: ['/og-image.png'],
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
        <Toaster
          position="top-right"
          richColors
          closeButton
          duration={4000}
        />
      </body>
    </html>
  );
}
