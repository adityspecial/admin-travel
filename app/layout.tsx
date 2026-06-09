import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

// Inter — the definitive product UI typeface: optical sizing, variable weight, superb at density
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800', '900'],
})

export const metadata: Metadata = {
  title: 'AirDunia Admin',
  description: 'AirDunia myBiz Administration',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  )
}
