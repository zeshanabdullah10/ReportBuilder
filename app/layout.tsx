import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'LabVIEW Report Builder',
  description: 'DIAdem-like report generator for LabVIEW. Design templates visually, generate reports offline.',
  keywords: ['LabVIEW', 'report generator', 'template builder', 'PDF', 'DIAdem'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
