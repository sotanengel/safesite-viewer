import type { Metadata } from 'next'
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import 'maplibre-gl/dist/maplibre-gl.css'
import './globals.css'

const SITE_URL = 'https://safesite-viewer.vercel.app'
const DESCRIPTION =
  '住所を入力するだけで、洪水・土砂・津波・地震などの災害リスクと立地特性を 1 画面で確認できる Web アプリ'

export const metadata: Metadata = {
  title: 'SafeSite Viewer — 立地安全性確認',
  description: DESCRIPTION,
  openGraph: {
    title: 'SafeSite Viewer — 立地安全性確認',
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: 'SafeSite Viewer',
    locale: 'ja_JP',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'SafeSite Viewer — 立地安全性確認',
    description: DESCRIPTION,
  },
  metadataBase: new URL(SITE_URL),
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja" className="h-full">
      <body className="h-full flex flex-col antialiased">
        <NuqsAdapter>{children}</NuqsAdapter>
      </body>
    </html>
  )
}
