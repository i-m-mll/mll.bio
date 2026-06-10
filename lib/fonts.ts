import localFont from 'next/font/local'

export const inter = localFont({
  src: [
    { path: '../public/fonts/inter/inter-latin-100-normal.woff2', weight: '100', style: 'normal' },
    { path: '../public/fonts/inter/inter-latin-200-normal.woff2', weight: '200', style: 'normal' },
    { path: '../public/fonts/inter/inter-latin-300-normal.woff2', weight: '300', style: 'normal' },
    { path: '../public/fonts/inter/inter-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: '../public/fonts/inter/inter-latin-500-normal.woff2', weight: '500', style: 'normal' },
    { path: '../public/fonts/inter/inter-latin-600-normal.woff2', weight: '600', style: 'normal' },
    { path: '../public/fonts/inter/inter-latin-700-normal.woff2', weight: '700', style: 'normal' },
    { path: '../public/fonts/inter/inter-latin-800-normal.woff2', weight: '800', style: 'normal' },
    { path: '../public/fonts/inter/inter-latin-900-normal.woff2', weight: '900', style: 'normal' },
    { path: '../public/fonts/inter/inter-latin-100-italic.woff2', weight: '100', style: 'italic' },
    { path: '../public/fonts/inter/inter-latin-200-italic.woff2', weight: '200', style: 'italic' },
    { path: '../public/fonts/inter/inter-latin-300-italic.woff2', weight: '300', style: 'italic' },
    { path: '../public/fonts/inter/inter-latin-400-italic.woff2', weight: '400', style: 'italic' },
    { path: '../public/fonts/inter/inter-latin-500-italic.woff2', weight: '500', style: 'italic' },
    { path: '../public/fonts/inter/inter-latin-600-italic.woff2', weight: '600', style: 'italic' },
    { path: '../public/fonts/inter/inter-latin-700-italic.woff2', weight: '700', style: 'italic' },
    { path: '../public/fonts/inter/inter-latin-800-italic.woff2', weight: '800', style: 'italic' },
    { path: '../public/fonts/inter/inter-latin-900-italic.woff2', weight: '900', style: 'italic' },
  ],
  display: 'swap',
  variable: '--font-inter',
})

export const roboto = localFont({
  src: [
    { path: '../public/fonts/roboto/roboto-latin-300-normal.woff2', weight: '300', style: 'normal' },
    { path: '../public/fonts/roboto/roboto-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: '../public/fonts/roboto/roboto-latin-500-normal.woff2', weight: '500', style: 'normal' },
    { path: '../public/fonts/roboto/roboto-latin-700-normal.woff2', weight: '700', style: 'normal' },
  ],
  display: 'swap',
  variable: '--font-roboto',
})

export const roboto_mono = localFont({
  src: [
    { path: '../public/fonts/roboto-mono/roboto-mono-latin-100-normal.woff2', weight: '100', style: 'normal' },
    { path: '../public/fonts/roboto-mono/roboto-mono-latin-200-normal.woff2', weight: '200', style: 'normal' },
    { path: '../public/fonts/roboto-mono/roboto-mono-latin-300-normal.woff2', weight: '300', style: 'normal' },
    { path: '../public/fonts/roboto-mono/roboto-mono-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: '../public/fonts/roboto-mono/roboto-mono-latin-500-normal.woff2', weight: '500', style: 'normal' },
    { path: '../public/fonts/roboto-mono/roboto-mono-latin-600-normal.woff2', weight: '600', style: 'normal' },
    { path: '../public/fonts/roboto-mono/roboto-mono-latin-700-normal.woff2', weight: '700', style: 'normal' },
    { path: '../public/fonts/roboto-mono/roboto-mono-latin-100-italic.woff2', weight: '100', style: 'italic' },
    { path: '../public/fonts/roboto-mono/roboto-mono-latin-200-italic.woff2', weight: '200', style: 'italic' },
    { path: '../public/fonts/roboto-mono/roboto-mono-latin-300-italic.woff2', weight: '300', style: 'italic' },
    { path: '../public/fonts/roboto-mono/roboto-mono-latin-400-italic.woff2', weight: '400', style: 'italic' },
    { path: '../public/fonts/roboto-mono/roboto-mono-latin-500-italic.woff2', weight: '500', style: 'italic' },
    { path: '../public/fonts/roboto-mono/roboto-mono-latin-600-italic.woff2', weight: '600', style: 'italic' },
    { path: '../public/fonts/roboto-mono/roboto-mono-latin-700-italic.woff2', weight: '700', style: 'italic' },
  ],
  display: 'swap',
  variable: '--font-roboto-mono',
})

export const source_serif = localFont({
  src: [
    { path: '../public/fonts/source-serif-4/source-serif-4-latin-200-normal.woff2', weight: '200', style: 'normal' },
    { path: '../public/fonts/source-serif-4/source-serif-4-latin-300-normal.woff2', weight: '300', style: 'normal' },
    { path: '../public/fonts/source-serif-4/source-serif-4-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: '../public/fonts/source-serif-4/source-serif-4-latin-500-normal.woff2', weight: '500', style: 'normal' },
    { path: '../public/fonts/source-serif-4/source-serif-4-latin-600-normal.woff2', weight: '600', style: 'normal' },
    { path: '../public/fonts/source-serif-4/source-serif-4-latin-700-normal.woff2', weight: '700', style: 'normal' },
    { path: '../public/fonts/source-serif-4/source-serif-4-latin-800-normal.woff2', weight: '800', style: 'normal' },
    { path: '../public/fonts/source-serif-4/source-serif-4-latin-900-normal.woff2', weight: '900', style: 'normal' },
    { path: '../public/fonts/source-serif-4/source-serif-4-latin-200-italic.woff2', weight: '200', style: 'italic' },
    { path: '../public/fonts/source-serif-4/source-serif-4-latin-300-italic.woff2', weight: '300', style: 'italic' },
    { path: '../public/fonts/source-serif-4/source-serif-4-latin-400-italic.woff2', weight: '400', style: 'italic' },
    { path: '../public/fonts/source-serif-4/source-serif-4-latin-500-italic.woff2', weight: '500', style: 'italic' },
    { path: '../public/fonts/source-serif-4/source-serif-4-latin-600-italic.woff2', weight: '600', style: 'italic' },
    { path: '../public/fonts/source-serif-4/source-serif-4-latin-700-italic.woff2', weight: '700', style: 'italic' },
    { path: '../public/fonts/source-serif-4/source-serif-4-latin-800-italic.woff2', weight: '800', style: 'italic' },
    { path: '../public/fonts/source-serif-4/source-serif-4-latin-900-italic.woff2', weight: '900', style: 'italic' },
  ],
  display: 'swap',
  variable: '--font-source-serif',
})

// Fira Sans for site title
export const fira_sans = localFont({
  src: [
    { path: '../public/fonts/fira-sans/fira-sans-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: '../public/fonts/fira-sans/fira-sans-latin-500-normal.woff2', weight: '500', style: 'normal' },
    { path: '../public/fonts/fira-sans/fira-sans-latin-600-normal.woff2', weight: '600', style: 'normal' },
    { path: '../public/fonts/fira-sans/fira-sans-latin-700-normal.woff2', weight: '700', style: 'normal' },
  ],
  display: 'swap',
  variable: '--font-fira-sans',
})
