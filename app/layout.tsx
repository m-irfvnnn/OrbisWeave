import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { AuthProvider } from '@/components/account-state'
import { AIProvider } from '@/components/ai-provider'
import { ConversationsProvider } from '@/components/conversations-provider'
import { KnowledgeProvider } from '@/components/knowledge-provider'
import { WorkspaceProvider } from '@/components/workspace-state'
import './globals.css'
import './app-styles.css'
import './auth-styles.css'

export const metadata: Metadata = {
  title: 'OrbisWeave — AI development workspace',
  description: 'Turn ideas into powerful AI agents and automations in the OrbisWeave workspace.',
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
  themeColor: '#080a0d',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthProvider><WorkspaceProvider><KnowledgeProvider><ConversationsProvider><AIProvider>{children}</AIProvider></ConversationsProvider></KnowledgeProvider></WorkspaceProvider></AuthProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
