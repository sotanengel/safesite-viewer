import type { Metadata } from 'next'
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import 'maplibre-gl/dist/maplibre-gl.css'
import './globals.css'

export const metadata: Metadata = {
  title: 'SafeSite Viewer — 立地安全性確認',
  description:
    '住所を入力するだけで、洪水・土砂・津波・地震などの災害リスクと立地特性を 1 画面で確認できる Web アプリ',
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
