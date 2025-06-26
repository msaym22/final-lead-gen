import { Inter } from 'next/font/google'
import './globals.css'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { Header } from '@/components/dashboard/Header'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'AI Lead Generator - Automated Lead Generation & Outreach',
  description: 'AI-powered lead generation system with YouTube research and personalized outreach for marketing professionals',
  keywords: 'lead generation, AI automation, marketing, paid advertising, email marketing',
  authors: [{ name: 'Muhammad Saim' }],
  creator: 'Muhammad Saim',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-background text-foreground antialiased`}>
        <div className="flex h-screen bg-gradient-dark">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <Header />
            <main className="flex-1 overflow-y-auto p-6">
              <div className="max-w-7xl mx-auto">
                {children}
              </div>
            </main>
          </div>
        </div>
      </body>
    </html>
  )
}