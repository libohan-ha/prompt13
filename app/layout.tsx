import { Toaster } from "@/components/ui/toaster"
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import React from 'react'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  fallback: ['system-ui', 'arial']
})

export const metadata: Metadata = {
  title: 'Prompt Optimizer',
  description: 'AI提示词优化工具',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh">
      <body className={inter.className}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
