import { Inter, Roboto, Roboto_Mono, Source_Serif_4, Fira_Sans } from 'next/font/google'

export const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const roboto = Roboto({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto',
  weight: ['300', '400', '500', '700'],
})

export const roboto_mono = Roboto_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto-mono',
})

export const source_serif = Source_Serif_4({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-source-serif',
})

// Fira Sans for site title
export const fira_sans = Fira_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-fira-sans',
  weight: ['400', '500', '600', '700'],
}) 