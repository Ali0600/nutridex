import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { Disclaimer } from '@/components/Disclaimer';
import './globals.css';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'NutriDex — science-backed food benefits',
    template: '%s · NutriDex',
  },
  description:
    'A nutrition database of teas, fruits, vegetables, meats, and nuts — every benefit explained with the science behind it and linked studies.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white font-sans text-neutral-900 antialiased">
        <header className="border-b border-leaf-100">
          <div className="mx-auto flex max-w-5xl items-baseline gap-3 px-4 py-4">
            <Link href="/" className="text-xl font-bold text-leaf-700">
              NutriDex
            </Link>
            <span className="text-sm text-neutral-500">every food, explained</span>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
        <footer className="border-t border-leaf-100">
          <div className="mx-auto max-w-5xl px-4 py-6 text-sm text-neutral-500">
            <Disclaimer />
            <p className="mt-2">© {new Date().getFullYear()} NutriDex</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
