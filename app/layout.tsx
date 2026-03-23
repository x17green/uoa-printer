import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Providers } from '@/components/providers'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Payroll Management System',
  description: 'University of Africa Payroll Printing System - Process and print payroll data',
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${_geist.className} font-sans antialiased bg-slate-50 text-slate-900`}>
        <Providers>
          <div className="app-shell grid min-h-screen grid-cols-1 md:grid-cols-[240px_1fr]">
            <aside className="app-sidebar hidden md:flex flex-col gap-4 border-r border-slate-200 bg-white p-4">
              <div className="flex items-center gap-2 p-2">
                <img
                  src="/logos/university_of_african_logo.png"
                  alt="University of African"
                  className="h-10 w-10 object-contain"
                />
                <div>
                  <p className="text-lg font-bold">University of African</p>
                  <p className="text-xs text-muted-foreground">Payroll Suite</p>
                </div>
              </div>
              <nav className="flex flex-col gap-1">
                <a href="/" className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700">Dashboard</a>
                <a href="/payroll" className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700">Payroll Runs</a>
                <a href="/payroll/1/print" className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700">Print Workflow</a>
                <a href="/validation" className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700">Validation Reports</a>
                <a href="/settings" className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700">Settings</a>
              </nav>
              <div className="mt-auto text-xs text-muted-foreground">
                <p>UoAfrica Payroll v1.0</p>
                <p>Powered by University of African</p>
              </div>
            </aside>

            <div className="main-content flex min-h-screen flex-col">
              <header className="app-header sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <button className="md:hidden rounded-md border border-slate-300 px-2 py-1 text-sm">Menu</button>
                  <p className="text-lg font-semibold">Payroll Management System</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Logged in as <strong>Admin</strong></span>
                  <span>•</span>
                  <span>Role: HR</span>
                </div>
              </header>

              <main className="flex-1 p-4">{children}</main>

              <footer className="app-footer border-t border-slate-200 bg-white p-4 text-center text-xs text-muted-foreground">
                University of African Payroll System © {new Date().getFullYear()}. All rights reserved.
              </footer>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  )
}
