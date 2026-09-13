import type { Metadata } from 'next';
import { Cormorant_Garamond, Inter } from 'next/font/google';
import '../styles/globals.css';
import { Header } from '../components/storefront/Header';
import { Footer } from '../components/storefront/Footer';
import { StorefrontProvider } from '../components/storefront/StorefrontProvider';
import { Panels } from '../components/storefront/Panels';
import { CommunityDialog } from '../components/storefront/CommunityDialog';
import { PageFrame } from '../components/storefront/PageFrame';
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
      <head>
        <link rel="stylesheet" href="/assets/css/styles-preview.css" />
        <link rel="stylesheet" href="/assets/css/light-theme.css?v=20260727-brand-assets" />
      </head>
      <body className={`${inter.variable} ${cormorant.variable}`}>
        <StorefrontProvider>
        <AnalyticsTracker />
        <a
          href="#main-content"
          className="sr-only z-50 bg-marine px-4 py-3 text-white focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
        >
          Aller au contenu
        </a>
        <Header />
        <main id="main-content"><PageFrame>{children}</PageFrame></main>
        <Footer />
        <Panels />
        <CommunityDialog />
        </StorefrontProvider>
      </body>
    </html>
  );
}
