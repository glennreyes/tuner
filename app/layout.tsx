import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';
import { Inter, Roboto_Mono } from 'next/font/google';

import './globals.css';

const mono = Roboto_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: 'variable',
});
const sans = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: 'variable',
});

export const metadata: Metadata = {
  description: 'A simple web app to tune your string instrument.',
  title: 'Napaling Tuner',
};

export const viewport: Viewport = {
  initialScale: 1,
  width: 'device-width',
};

interface RootLayoutProps {
  children: ReactNode;
}

const RootLayout = ({ children }: RootLayoutProps) => (
  <html lang="en">
    <body
      className={cn(
        mono.variable,
        sans.variable,
        'dark bg-background font-sans text-foreground motion-safe:scroll-smooth',
      )}
    >
      {children}
    </body>
  </html>
);

export default RootLayout;
