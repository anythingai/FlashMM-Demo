import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  return (
    <div className="mx-auto max-w-6xl py-10 space-y-10">
      <section className="relative overflow-hidden rounded-2xl border bg-background/50 backdrop-blur">
        <div className="absolute inset-0 bg-[radial-gradient(600px_circle_at_0%_0%,rgba(16,185,129,0.12),transparent_60%),radial-gradient(600px_circle_at_100%_0%,rgba(168,85,247,0.12),transparent_60%)]" />
        <div className="relative p-8 sm:p-12">
          <div className="inline-flex items-center gap-2 rounded-full border bg-background/60 px-3 py-1 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_12px_theme(colors.emerald.400)]" />
            Sei Testnet
          </div>
          <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl">
            <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-fuchsia-400 bg-clip-text text-transparent">
              FlashMM
            </span>{" "}
            — Predictive On‑Chain Market‑Making Agent
          </h1>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            AI‑driven, latency‑sensitive agent that streams Sei order‑books, predicts short‑term price moves,
            and posts adaptive passive quotes to tighten spreads and earn maker fees.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/dashboard">
              <Button className="shadow-[0_0_30px_rgba(16,185,129,0.25)] hover:shadow-[0_0_40px_rgba(16,185,129,0.35)]">
                View Live Dashboard
              </Button>
            </Link>
            <a href="https://docs.sei.io/core/clob" target="_blank" rel="noreferrer">
              <Button variant="outline">Sei CLOB Docs</Button>
            </a>
            <Badge variant="secondary" className="ml-2">MIT Open‑Source</Badge>
          </div>
        </div>
      </section>

      <section className="grid gap-6 sm:grid-cols-3">
        <Card className="p-6 bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/40">
          <h3 className="font-semibold">For Traders</h3>
          <p className="mt-2 text-sm text-muted-foreground">Tighter spreads → lower slippage.</p>
        </Card>
        <Card className="p-6 bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/40">
          <h3 className="font-semibold">For Protocols</h3>
          <p className="mt-2 text-sm text-muted-foreground">Deeper liquidity → higher volume & revenue.</p>
        </Card>
        <Card className="p-6 bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/40">
          <h3 className="font-semibold">For Sei</h3>
          <p className="mt-2 text-sm text-muted-foreground">Showcases sub‑second finality & ML‑powered agents.</p>
        </Card>
      </section>

      <section className="grid gap-6 sm:grid-cols-4">
        <Card className="p-5">
          <div className="text-xs text-muted-foreground">Spread Improvement</div>
          <div className="mt-1 text-2xl font-semibold">≥ 40%</div>
        </Card>
        <Card className="p-5">
          <div className="text-xs text-muted-foreground">Maker ROI (daily)</div>
          <div className="mt-1 text-2xl font-semibold">≥ 0.2%</div>
        </Card>
        <Card className="p-5">
          <div className="text-xs text-muted-foreground">Inventory Band</div>
          <div className="mt-1 text-2xl font-semibold">± 2%</div>
        </Card>
        <Card className="p-5">
          <div className="text-xs text-muted-foreground">Uptime</div>
          <div className="mt-1 text-2xl font-semibold">&gt; 98%</div>
        </Card>
      </section>

      <section className="rounded-2xl border p-6">
        <h3 className="text-lg font-semibold">Key Features</h3>
        <ul className="mt-3 grid list-disc gap-2 pl-5 text-sm text-muted-foreground sm:grid-cols-2">
          <li>Real‑time Sei WebSocket order‑book + trades (target &lt;250 ms)</li>
          <li>Lightweight transformer/LSTM predictions @ 100–500 ms horizon</li>
          <li>Dynamic quote spread/size by predicted move & confidence</li>
          <li>Inventory mgmt: skew to mean‑revert, cut on vol spikes</li>
          <li>Order routing via Cambrian SDK w/ deterministic cleanup</li>
          <li>Telemetry: PnL, spread, latency, fills; public dashboard</li>
        </ul>
        <div className="mt-4 flex gap-3">
          <Link href="/dashboard">
            <Button variant="secondary">Open Dashboard</Button>
          </Link></div>
      </section>
    </div>
  );
}
