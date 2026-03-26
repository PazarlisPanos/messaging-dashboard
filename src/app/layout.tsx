import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'MsgHub',
  description: 'Messaging Dashboard powered by n8n automation',
  icons: {
    icon: '/favicon.ico',
    apple: '/icon.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
