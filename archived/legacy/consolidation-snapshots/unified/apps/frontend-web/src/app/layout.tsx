import type { Metadata } from 'next';
import { Cormorant_Garamond, Inter } from 'next/font/google';
import '../styles/globals.css';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { ScrollReveal } from '../components/ScrollReveal';
import { AnalyticsTracker } from '../components/AnalyticsTracker';

const inter = Inter({ subsets: ['latin'], variable: '--font-body' });
const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400', '500', '600', '700'],
});
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'IMANA Signature - Parfums & Lifestyle Premium',
  description:
    'Collections de parfums, accessoires premium et art de vivre raffine.',
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    siteName: 'IMANA Signature',
    title: 'IMANA Signature',
    description: 'Parfums et art de vivre premium.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className={`${inter.variable} ${cormorant.variable} ${inter.className}`}>
        <ScrollReveal />
        <AnalyticsTracker />
        <a
          href="#main-content"
          className="sr-only z-50 bg-marine px-4 py-3 text-white focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
        >
          Aller au contenu
        </a>
        <Header />
        <main id="main-content" className="min-h-screen">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
