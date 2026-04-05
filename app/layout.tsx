import type { Metadata } from 'next'
import { Manrope, Space_Grotesk } from 'next/font/google'

import ThemeSync from './_components/theme-sync'
import './globals.css'
import { getServerTheme } from './theme-server'

const manrope = Manrope({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  preload: true,
})

const spaceGrotesk = Space_Grotesk({
  variable: '--font-display',
  subsets: ['latin'],
  weight: ['500', '700'],
  preload: true,
})

export const metadata: Metadata = {
  title: 'Taskify',
  description: 'Workspace for projects, teams and planning',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // SSR: get theme from cookie
  const theme = await getServerTheme()
  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-theme={theme}
      className={`${manrope.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeSync />
        {children}
      </body>
    </html>
  )
}
