import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { PlayerProvider } from '@/components/PlayerProvider';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'osu! Radio',
  description: 'Play your osu! beatmap music',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): JSX.Element {
  return (
    <html lang="en">
      <body className={inter.className}>
        <PlayerProvider>{children}</PlayerProvider>
      </body>
    </html>
  );
}
