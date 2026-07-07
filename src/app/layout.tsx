import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Disclaimer } from '@/components/Disclaimer';
import { ItemSearchBox } from '@/components/ItemSearchBox';
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
          <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-4">
            <Link href="/" className="text-xl font-bold text-leaf-700">
              NutriDex
            </Link>
            <nav className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-neutral-600">
              <Link href="/super-foods" className="hover:text-leaf-700">
                Super Foods
              </Link>
              <Link href="/nutrients" className="hover:text-leaf-700">
                Nutrients
              </Link>
              <Link href="/quiz" className="hover:text-leaf-700">
                Quiz
              </Link>
              <Link href="/blog" className="hover:text-leaf-700">
                Blog
              </Link>
              <Link href="/compare" className="hover:text-leaf-700">
                Compare
              </Link>
            </nav>
            <div className="ms-auto">
              <ItemSearchBox compact placeholder="Search foods…" />
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
        <footer className="border-t border-leaf-100">
          <div className="mx-auto max-w-5xl px-4 py-6 text-sm text-neutral-500">
            <nav className="mb-4 flex flex-wrap gap-x-4 gap-y-1 text-neutral-600">
              <Link href="/items" className="hover:text-leaf-700">Foods</Link>
              <Link href="/categories" className="hover:text-leaf-700">Categories</Link>
              <Link href="/organs" className="hover:text-leaf-700">Body parts</Link>
              <Link href="/goals" className="hover:text-leaf-700">Goals</Link>
              <Link href="/nutrients" className="hover:text-leaf-700">Nutrients</Link>
              <Link href="/super-foods" className="hover:text-leaf-700">Super Foods</Link>
            </nav>
            <Disclaimer />
            <p className="mt-2">
              <Link href="/about" className="hover:text-leaf-700">
                About &amp; disclosures
              </Link>
              <span className="mx-2">·</span>© {new Date().getFullYear()} NutriDex
            </p>
          </div>
        </footer>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
