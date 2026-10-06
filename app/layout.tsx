import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { LocaleProvider } from '@/lib/i18n'
import { LanguageSwitcher } from '@/components/language-switcher'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' })

export const metadata: Metadata = {
  title: 'Ledgerline — Multi-chain Wallet Balance Checker',
  description:
    'Look up live balances for Bitcoin, Ethereum, Solana, Base, Arbitrum, Polygon and BNB Chain wallets straight from public blockchain explorers.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#15171b',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={`dark ${geist.variable} ${geistMono.variable}`}>
      <body className="font-sans antialiased">
        <LocaleProvider>
          <div className="mx-auto flex w-full max-w-5xl items-center justify-end px-4 pt-4 md:px-6">
            <LanguageSwitcher />
          </div>
          {children}
        </LocaleProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
}
