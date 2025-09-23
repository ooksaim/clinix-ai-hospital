import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { UserProvider } from "@/lib/user-context"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Clinix AI Hospital Management System",
  description:
    "Complete AI-Powered Hospital Management System - Patient records, diagnostics, analytics, and emergency protocols",
  keywords: "hospital management, AI healthcare, patient management, medical diagnosis, emergency protocols, hospital analytics",
  authors: [{ name: "Clinix Team" }],
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
  generator: 'v0.dev',
  openGraph: {
    title: "Clinix AI Hospital Management",
    description: "Revolutionary AI-powered hospital management system",
    type: "website",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="theme-color" content="#3b82f6" />
      </head>
      <body className={inter.className}>
        <UserProvider>
          {children}
        </UserProvider>
      </body>
    </html>
  )
}
