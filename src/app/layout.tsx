import type { Metadata } from 'next'
import { Jost, DM_Sans, JetBrains_Mono, Inter } from 'next/font/google'
import { Providers } from './providers'
import './globals.css'

const jost = Jost({
  subsets: ['latin'],
  weight: 'variable',
  variable: '--font-jost',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: 'variable',
  variable: '--font-dm-sans',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: 'variable',
  variable: '--font-jetbrains-mono',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  weight: 'variable',
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'VO2 Forge — AI Engineering Crew',
  description: 'Your AI engineering crew, on demand.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="fr"
      className={`${jost.variable} ${dmSans.variable} ${jetbrainsMono.variable} ${inter.variable}`}
    >
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
