import './globals.css';
import { Inter } from 'next/font/google';
import Header from '@/components/Header';
import { Providers } from './providers';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  adjustFontFallback: true,
});

export const metadata = {
  title: 'PassportX - Achievement Passport',
  description:
    'A portable, on-chain Achievement Passport built for communities, learners, and creators. Powered by Clarity 4 on Stacks.',
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
  openGraph: {
    title: 'PassportX - Achievement Passport',
    description:
      'A portable, on-chain Achievement Passport built for communities, learners, and creators. Powered by Clarity 4 on Stacks.',
    url: 'https://passportx.io',
    siteName: 'PassportX',
    images: [
      {
        url: '/logo.png',
        width: 500,
        height: 500,
        alt: 'PassportX Logo',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'PassportX - Achievement Passport',
    description:
      'A portable, on-chain Achievement Passport built for communities, learners, and creators.',
    images: ['/logo.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <div className="min-h-screen bg-gray-50">
            <Header />
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
