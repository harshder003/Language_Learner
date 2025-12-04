import type { Metadata } from 'next'
import './globals.css'
import { Providers } from '@/components/Providers'
import Navbar from '@/components/Navbar'

export const metadata: Metadata = {
  title: 'Language Learner',
  description: 'Track and learn languages with flashcards',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <Navbar />
          {children}
        </Providers>
      </body>
    </html>
  )
}

