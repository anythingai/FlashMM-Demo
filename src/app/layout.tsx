import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { CONFIG } from "@/lib/config";
import { WalletButton } from "@/components/wallet/wallet-button";
import { NetworkStatus } from "@/components/network-status";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FlashMM — Predictive On‑Chain MM (Sei Testnet)",
  description: "AI-driven market-making agent with real-time dashboard and operator controls",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <div className="fixed inset-0 -z-10 bg-gradient-to-br from-emerald-500/10 via-transparent to-fuchsia-500/10 blur-3xl" />
          <header className="sticky top-0 z-40 w-full border-b bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/40">
            <div className="container mx-auto max-w-6xl flex h-14 items-center justify-between px-4">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_15px_theme(colors.emerald.400)]" />
                <span className="font-semibold tracking-tight">FlashMM</span>
                <span className="text-xs text-muted-foreground ml-2">{CONFIG.NETWORK_NAME}</span>
              </div>
              <nav className="flex items-center gap-3">
                <Link className="text-sm text-muted-foreground hover:text-foreground" href="/">Home</Link>
                <a className="text-sm text-muted-foreground hover:text-foreground" href="/dashboard">Dashboard</a>
                <a className="text-sm text-muted-foreground hover:text-foreground" href={CONFIG.FAUCET_URL} target="_blank" rel="noreferrer">Faucet</a>
                <a className="text-sm text-muted-foreground hover:text-foreground" href={CONFIG.EXPLORER_URL} target="_blank" rel="noreferrer">Explorer</a>
                <NetworkStatus />
                <WalletButton />
                <ThemeToggle />
              </nav>
            </div>
          </header>
          <main className="container mx-auto max-w-6xl px-4 py-6">
            {children}
          </main>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
