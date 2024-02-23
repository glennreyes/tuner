import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

import { GitHub } from '@/components/icons/github';
import { X } from '@/components/icons/x';
import { cn } from '@/lib/utils';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { GeistMono } from 'geist/font/mono';
import { GeistSans } from 'geist/font/sans';

import './globals.css';

export const metadata: Metadata = {
  description: 'A chromatic tuner for musicians.',
  title: 'Tuner',
};

export const viewport: Viewport = {
  initialScale: 1,
  width: 'device-width',
};

interface RootLayoutProps {
  children: ReactNode;
}

const RootLayout = ({ children }: RootLayoutProps) => (
  <html className="dark" lang="en">
    <body
      className={cn(
        GeistSans.variable,
        GeistMono.variable,
        'bg-background font-sans text-foreground motion-safe:scroll-smooth',
      )}
    >
      <div className="container grid min-h-dvh max-w-screen-lg">
        <main className="grid items-center">{children}</main>
        <footer className="flex items-center justify-between gap-2">
          <p className="py-4 text-sm text-muted-foreground">
            Built by{' '}
            <a
              className="underline underline-offset-4"
              href="https://glennreyes.com"
              rel="noreferrer"
              target="_blank"
            >
              @glnnrys
            </a>
            . Source on{' '}
            <a
              className="underline underline-offset-4"
              href="https://github.com/glennreyes/tuner"
            >
              GitHub
            </a>
            .
          </p>
          <div className="flex gap-2 py-4">
            <a
              className="items-center justify-center rounded-full p-2 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              href="https://x.com/glnnrys"
              rel="noreferrer"
              target="_blank"
            >
              <X className="h-5 w-5" />
              <span className="sr-only">Twitter</span>
            </a>
            <a
              className="items-center justify-center rounded-full p-2 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              href="https://github.com/glennreyes/tuner"
              rel="noreferrer"
              target="_blank"
            >
              <GitHub className="h-5 w-5" />
              <span className="sr-only">Twitter</span>
            </a>
          </div>
        </footer>
      </div>

      <Analytics />
      <SpeedInsights />
    </body>
  </html>
);

export default RootLayout;
