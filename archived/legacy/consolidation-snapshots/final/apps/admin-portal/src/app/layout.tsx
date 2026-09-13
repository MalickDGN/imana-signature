import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './styles.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Administration | IMANA Signature',
  description: 'Pilotage du catalogue et des commandes IMANA Signature.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
