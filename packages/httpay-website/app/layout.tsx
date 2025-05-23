import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import Navbar from "@/components/navbar"
import { Toaster } from "@/components/ui/toaster"
import { WalletProvider } from "@/lib/wallet-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "HTTPay - Autonomous Payments for AI Agents",
  description: "Enabling AI agents to autonomously pay for services without human intervention",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          storageKey="httpay-theme"
        >
          <WalletProvider>
            <div className="relative min-h-screen flex flex-col">
              <Navbar />
              <main className="flex-1">{children}</main>
              <Toaster />
            </div>
          </WalletProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
