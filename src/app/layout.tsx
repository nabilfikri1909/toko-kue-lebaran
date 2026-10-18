import type { Metadata } from 'next';
import { Playfair_Display, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import AuthSync from '@/components/AuthSync';

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-playfair',
  display: 'swap',
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-jakarta',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Dapur Kue Lebaran',
  description:
    'Pesan kue kering Lebaran terbaik. Nastar, kastengel, putri salju, sagu keju, dan lainnya. Dipanggang dengan cinta untuk hari raya Anda.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${playfair.variable} ${jakarta.variable}`}>
      <body className="font-jakarta antialiased bg-cream text-cocoa min-h-screen">
        <AuthSync />
        {children}
      </body>
    </html>
  );
}
