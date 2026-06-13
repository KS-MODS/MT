import type { Metadata } from 'next';
import './globals.css';
import { AppProvider } from '@/context/AppContext';

const inter = {
  variable: '--font-inter',
};

export const metadata: Metadata = {
  title: 'Modded Team | KARTIK-SHARMA',
  description: 'Download, upload, review, and follow developers in Modded Team - the ultimate APK sharing community. Features ratings, verified badges, and developers leaderboards.',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap"
        />
      </head>
      <body className="min-h-full flex flex-col transition-colors duration-300">
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
