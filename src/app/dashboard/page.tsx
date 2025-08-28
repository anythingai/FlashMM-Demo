"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useSessionState } from "@/hooks/use-session-state";
import { AgentStatus } from "@/components/agent/agent-status";
import { CONFIG } from "@/lib/config";
import { pingLatency } from "@/lib/chain";
import { useWalletSession } from "@/hooks/use-wallet-session";

// ---- Types ----
type Side = "BID" | "ASK";
type QuoteLevel = { price: number; size: number };
type OrderBook = { bids: QuoteLevel[]; asks: QuoteLevel[] };
type Trade = { ts: number; side: Side; price: number; size: number };
type OrderSnapshot = {
  ts: number;
  market: string;
  mid: number;
  predictedDelta: number;
  confidence: number;
  bestBid: { price: number; size: number } | null;
  bestAsk: { price: number; size: number } | null;
};
type Market = "SEI/USDC" | "wETH/USDC";

export default function DashboardPage() {
  // ---- Config ----
  const TICK_MS = 200; // 5Hz
  const LEVELS = 3; // 3 levels per side
  const BASE_SPREAD_BPS = 10; // 0.10%
  const NOTIONAL_CAP_USDC = 2000; // Inventory limit
  const INVENTORY_BAND_PCT = 0.02; // ±2%
  const MAX_SIZE_PER_LEVEL = 500;

  // ---- State ----
  const [paused, setPaused] = useSessionState<boolean>("flashmm.paused", false);
  const [market, setMarket] = useSessionState<Market>("flashmm.market", "SEI/USDC");
  const [mid, setMid] = React.useState(1.0);
  const [book, setBook] = React.useState<OrderBook>({ bids: [], asks: [] });
  const [trades, setTrades] = React.useState<Trade[]>([]);
  const [latencyMs, setLatencyMs] = React.useState(120);
  const [confidence, setConfidence] = React.useState(0.55);
  const [, setPredictedDelta] = React.useState(0);
  const [position, setPosition] = React.useState(0);
  const [cash, setCash] = React.useState(0);
  const [zScore, setZScore] = React.useState(0);
  const [autoWidening, setAutoWidening] = React.useState(false);

  // Wallet/Chain telemetry
  const { address, walletName } = useWalletSession();
  const [walletBalance, setWalletBalance] = React.useState<string>("0");
  const [, setBlockHeight] = React.useState<number | null>(null);
  const [rpcMs, setRpcMs] = React.useState<number | null>(null);

  // Presenter-driven userflow steps (clickable)
  const [connected, setConnected] = React.useState(false);
  const [ingesting, setIngesting] = React.useState(false);
  const [normalized, setNormalized] = React.useState(false);
  const [predicting, setPredicting] = React.useState(false);
  const [quoting, setQuoting] = React.useState(false);
  const [routerBound, setRouterBound] = React.useState(false);
  const [telemetryOn, setTelemetryOn] = React.useState(false);
  const [failsafeArmed, setFailsafeArmed] = React.useState(false);

  // For volatility calc
  const returnsRef = React.useRef<number[]>([]);
  const lastMidRef = React.useRef(mid);
  const tickHandle = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const lastPostRef = React.useRef(0);
  const [routerSnapshots, setRouterSnapshots] = React.useState<OrderSnapshot[]>([]);

  // Seed per-market starting price
  React.useEffect(() => {
    if (market === "SEI/USDC") {
      setMid(0.04);
      setPosition(0);
      setCash(0);
      setTrades([]);
    } else {
      setMid(3200);
      setPosition(0);
      setCash(0);
      setTrades([]);
    }
    returnsRef.current = [];
    lastMidRef.current = mid;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [market]);

  // Chain telemetry polling when telemetry is enabled
  React.useEffect(() => {
    let pollId: NodeJS.Timeout;
    if (telemetryOn) {
      const runTelemetry = async () => {
        try {
          const ms = await pingLatency("/api/health");
          setRpcMs(ms);
          // Mock block height for demo
          setBlockHeight(prev => (prev || 12500000) + Math.floor(Math.random() * 3));
        } catch {
          setRpcMs(null);
        }
      };
      runTelemetry();
      pollId = setInterval(runTelemetry, 5000);
    }
    return () => pollId && clearInterval(pollId);
  }, [telemetryOn]);

  React.useEffect(() => {
    // Fetch wallet balance when connected and telemetry is on
    if (address && telemetryOn) {
      // Mock wallet balance for demo
      setWalletBalance((Math.random() * 1000 + 100).toFixed(2));
    }
  }, [address, telemetryOn]);

  // ---- Engine Tick ----
  React.useEffect(() => {
    if (tickHandle.current) clearInterval(tickHandle.current);

    if (!ingesting) return;

    tickHandle.current = setInterval(() => {
      if (paused) return;

      // 1) Latency jitter window (80-180ms)
      const newLatency = 80 + Math.floor(Math.random() * 100);
      setLatencyMs(newLatency);

      // 2) Price dynamics (random walk + gentle drift)
      const vol = market === "SEI/USDC" ? 0.00015 : 0.75;
      const noise = randn() * vol;
      const drift = 0;
      const newMidRaw = Math.max(0.0001, lastMidRef.current * (1 + noise + drift));

      // 3) Prediction (100–500ms horizon)
      const pred = (Math.random() - 0.5) * (market === "SEI/USDC" ? 0.0002 : 1.0);
      const conf = 0.52 + Math.random() * 0.12;
      if (predicting) {
        setPredictedDelta(pred);
        setConfidence(conf);
      }

      // 4) Volatility and z-score
      const ret = (newMidRaw - lastMidRef.current) / lastMidRef.current;
      const buf = returnsRef.current;
      buf.push(ret);
      if (buf.length > 10) buf.shift();
      const mu = avg(buf);
      const sd = stddev(buf, mu) || 1e-9;
      const z = (ret - mu) / sd;
      setZScore(z);

      // 5) Inventory band check
      const invNotional = Math.abs(position * newMidRaw);
      const invBandBreached = invNotional > NOTIONAL_CAP_USDC * INVENTORY_BAND_PCT;
      const highZ = Math.abs(z) > 5;
      const doAutoWiden = invBandBreached || highZ;
      setAutoWidening(doAutoWiden);

      if (highZ && failsafeArmed) {
        setPaused(true);
      }

      // 6) Build quotes
      const dynamicAdjBps = clamp(Math.abs(pred) / newMidRaw * 10000, 0, 20);
      const widenBps = doAutoWiden ? 20 : 0;
      const spreadBps = BASE_SPREAD_BPS + dynamicAdjBps + widenBps;
      const skew = clamp(position * newMidRaw / NOTIONAL_CAP_USDC, -0.02, 0.02);

      const mm = newMidRaw * (1 - skew);
      const lvls = LEVELS;
      const bids: QuoteLevel[] = [];
      const asks: QuoteLevel[] = [];

      for (let i = 0; i < lvls; i++) {
        const offsetBps = spreadBps * (1 + i * 0.6);
        const bidPrice = mm * (1 - offsetBps / 20000);
        const askPrice = mm * (1 + offsetBps / 20000);
        const sizeBias = (conf - 0.5) * 2;
        const baseSize = MAX_SIZE_PER_LEVEL * (1 - i * 0.2);
        const bidSize = clamp(baseSize * (pred < 0 ? 1 + Math.abs(sizeBias) : 1 - Math.abs(sizeBias)), 50, MAX_SIZE_PER_LEVEL);
        const askSize = clamp(baseSize * (pred > 0 ? 1 + Math.abs(sizeBias) : 1 - Math.abs(sizeBias)), 50, MAX_SIZE_PER_LEVEL);

        bids.push({ price: roundPx(bidPrice, market), size: Math.round(bidSize) });
        asks.push({ price: roundPx(askPrice, market), size: Math.round(askSize) });
      }

      // 7) Estimate fills based on proximity and predicted move
      let dPosition = 0;
      let dCash = 0;
      const newTrades: Trade[] = [];

      const hitBias = clamp((pred / newMidRaw) * 100, -2.5, 2.5);
      const bestBid = bids[0];
      const bestAsk = asks[0];
      const pBidHit = clamp(0.15 + (hitBias < 0 ? Math.abs(hitBias) * 0.05 : 0), 0, 0.5);
      const pAskHit = clamp(0.15 + (hitBias > 0 ? Math.abs(hitBias) * 0.05 : 0), 0, 0.5);

      // Throttle and POST snapshot to router API
      if (routerBound && quoting && Date.now() - lastPostRef.current > 1000) {
        lastPostRef.current = Date.now();
        try {
          fetch("/api/orders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              market,
              mid: newMidRaw,
              predictedDelta: pred,
              confidence: conf,
              bestBid,
              bestAsk,
            }),
          });
        } catch {}
      }

      if (quoting) {
        if (Math.random() < pBidHit) {
          const fillSize = Math.round(bestBid.size * (0.25 + Math.random() * 0.5));
          dPosition += fillSize;
          dCash -= fillSize * bestBid.price;
          newTrades.push({ ts: Date.now(), side: "BID", price: bestBid.price, size: fillSize });
        }
        if (Math.random() < pAskHit) {
          const fillSize = Math.round(bestAsk.size * (0.25 + Math.random() * 0.5));
          dPosition -= fillSize;
          dCash += fillSize * bestAsk.price;
          newTrades.push({ ts: Date.now(), side: "ASK", price: bestAsk.price, size: fillSize });
        }
      }

      // 8) Commit state
      setBook({ bids: quoting ? bids : [], asks: quoting ? asks : [] });
      setMid(newMidRaw);
      lastMidRef.current = newMidRaw;

      if (dPosition !== 0 || dCash !== 0) {
        setPosition((p) => p + dPosition);
        setCash((c) => c + dCash);
        setTrades((t) => {
          const arr = [...newTrades, ...t];
          return arr.slice(0, 24);
        });
      }
    }, TICK_MS);

    return () => {
      if (tickHandle.current) clearInterval(tickHandle.current);
    };
  }, [paused, market, position, ingesting, predicting, quoting, routerBound, failsafeArmed, setPaused]);

  // Poll recent snapshots from router API when telemetry is enabled
  React.useEffect(() => {
    if (!telemetryOn) return;
    const id = setInterval(async () => {
      try {
        const res = await fetch("/api/orders", { cache: "no-store" });
        const json = await res.json();
        if (Array.isArray(json?.data)) {
          setRouterSnapshots(json.data);
        }
      } catch {}
    }, 2000);
    return () => clearInterval(id);
  }, [telemetryOn]);

  // ---- Derived ----
  const mtm = cash + position * mid;
  const invNotional = Math.abs(position * mid);
  const invPct = invNotional / NOTIONAL_CAP_USDC;
  const bestBidPx = book.bids[0]?.price ?? 0;
  const bestAskPx = book.asks[0]?.price ?? 0;
  const currentSpreadPct = bestBidPx > 0 && bestAskPx > 0 ? (bestAskPx - bestBidPx) / mid : 0;

  return (
    <div className="space-y-6">
      {/* Top meta */}
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-300 border-emerald-500/30">Live</Badge>
        <Badge variant="secondary" className="bg-fuchsia-500/10 text-fuchsia-300 border-fuchsia-500/30">{CONFIG.NETWORK_NAME}</Badge>
        {autoWidening ? (
          <Badge className="bg-amber-500/10 text-amber-300 border-amber-500/30">Auto‑Widening Active</Badge>
        ) : null}
      </div>

      {/* Agent Initialization & Userflow Stepper */}
      <AgentStatus
        paused={paused}
        setPaused={setPaused}
        connected={connected}
        ingesting={ingesting}
        normalized={normalized}
        predicting={predicting}
        quoting={quoting}
        routerBound={routerBound}
        telemetryOn={telemetryOn}
        failsafeArmed={failsafeArmed}
        onConnect={() => setConnected(true)}
        onStartIngest={() => setIngesting(true)}
        onNormalize={() => setNormalized(true)}
        onStartPredict={() => setPredicting(true)}
        onStartQuoting={() => setQuoting(true)}
        onBindRouter={() => setRouterBound(true)}
        onEnableTelemetry={() => setTelemetryOn(true)}
        onArmFailsafe={() => setFailsafeArmed(true)}
      />

      {/* Controls */}
      <Card className="p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button onClick={() => setPaused((p) => !p)} variant={paused ? "default" : "secondary"}>
            {paused ? "Resume" : "Pause"} Engine
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant={market === "SEI/USDC" ? "default" : "outline"}
              onClick={() => setMarket("SEI/USDC")}
            >
              SEI/USDC
            </Button>
            <Button
              variant={market === "wETH/USDC" ? "default" : "outline"}
              onClick={() => setMarket("wETH/USDC")}
            >
              wETH/USDC
            </Button>
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          Prediction horizon 100–500ms • Confidence {pct(confidence)} • z-score {zScore.toFixed(2)}
          {address ? (
            <span className="ml-3">• {(walletName ?? "Wallet")}: {address.slice(0, 8)}…{address.slice(-6)}</span>
          ) : null}
        </div>
      </Card>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <MetricCard label="Mid Price" value={fmtPx(mid, market)} suffix="" />
        <MetricCard label="Spread" value={(currentSpreadPct * 100).toFixed(2)} suffix="%" />
        <MetricCard label="PnL (MTM)" value={fmtUsd(mtm)} suffix="" neon="emerald" />
        <MetricCard label="Engine Latency" value={`${latencyMs}`} suffix="ms" />
        <MetricCard label="RPC Latency" value={rpcMs ?? "-"} suffix={rpcMs ? "ms" : ""} />
        <MetricCard label="Wallet Balance" value={walletBalance} suffix=" SEI" />
      </div>

      {/* Main grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Order Book */}
        <Card className="p-4 lg:col-span-2">
          <h3 className="font-semibold">Order Book (Top 3)</h3>
          <div className="mt-3 grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Bids</div>
              <OrderLevels side="BID" levels={book.bids} market={market} />
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Asks</div>
              <OrderLevels side="ASK" levels={book.asks} market={market} />
            </div>
          </div>
        </Card>

        {/* Inventory / Risk */}
        <Card className="p-4 space-y-3">
          <h3 className="font-semibold">Inventory & Risk</h3>
          <div className="text-sm text-muted-foreground">
            Position: {position.toFixed(2)} base
          </div>
          <div className="text-sm text-muted-foreground">
            Inventory Notional: {fmtUsd(invNotional)} ({(invPct * 100).toFixed(2)}%)
          </div>
          <div className="h-2 w-full rounded bg-muted overflow-hidden">
            <div
              className="h-full bg-emerald-500/70"
              style={{ width: `${Math.min(100, invPct * 100)}%` }}
            />
          </div>
          <div className="text-xs text-muted-foreground">Limit: ±{(INVENTORY_BAND_PCT * 100).toFixed(0)}% of ${NOTIONAL_CAP_USDC} notional</div>
          <div className="text-xs text-muted-foreground">Kill‑switch triggers auto‑pause on extreme conditions.</div>
          {autoWidening && (
            <div className="text-xs text-amber-300">Auto‑widening quotes due to inventory or volatility.</div>
          )}
        </Card>
      </div>

      {/* Trades feed */}
      <Card className="p-4">
        <h3 className="font-semibold">Recent Fills</h3>
        {trades.length === 0 ? (
          <div className="text-sm text-muted-foreground mt-2">No fills yet.</div>
        ) : (
          <div className="mt-3 grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
            {trades.map((t, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded border px-3 py-2 text-sm bg-background/60"
              >
                <span className={t.side === "BID" ? "text-emerald-300" : "text-fuchsia-300"}>
                  {t.side}
                </span>
                <span>{fmtPx(t.price, market)}</span>
                <span className="text-muted-foreground">{t.size}</span>
                <span className="text-xs text-muted-foreground">{new Date(t.ts).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Router snapshots */}
      <Card className="p-4">
        <h3 className="font-semibold">Order Router — Recent Activity</h3>
        {routerSnapshots.length === 0 ? (
          <div className="text-sm text-muted-foreground mt-2">No recent activity</div>
        ) : (
          <div className="mt-3 grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
            {routerSnapshots.slice(0, 6).map((s, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded border px-3 py-2 text-sm bg-background/60"
              >
                <span className="text-muted-foreground">{s.market}</span>
                <span>{fmtPx(s.mid, market)}</span>
                <span className="text-xs text-muted-foreground">{(s.confidence * 100).toFixed(0)}%</span>
                <span className="text-emerald-300">
                  {s.bestBid?.price != null ? fmtPx(s.bestBid.price, market) : "-"}
                </span>
                <span className="text-fuchsia-300">
                  {s.bestAsk?.price != null ? fmtPx(s.bestAsk.price, market) : "-"}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Social Update */}
      <Card className="p-4 space-y-2">
        <h3 className="font-semibold">Social Update</h3>
        <div className="text-sm text-muted-foreground">
          FlashMM on {CONFIG.NETWORK_NAME} tightening spreads: current spread {(currentSpreadPct * 100).toFixed(2)}%, MTM PnL {fmtUsd(mtm)}, latency ~{latencyMs}ms. Confidence {pct(confidence)}. #Sei #CLOB #AI #MM
        </div>
        <div className="flex gap-2">
          <a
            className="text-xs underline text-muted-foreground"
            href="https://docs.sei.io/core/clob"
            target="_blank"
            rel="noreferrer"
          >
            Sei CLOB Docs
          </a>
          <Link className="text-xs underline text-muted-foreground" href="/">
            PRD & Landing
          </Link>
        </div>
      </Card>
    </div>
  );
}

// ---- Components ----
function MetricCard({
  label,
  value,
  suffix,
  neon,
}: {
  label: string;
  value: string | number;
  suffix?: string;
  neon?: "emerald" | "fuchsia";
}) {
  const neonClass =
    neon === "emerald"
      ? "shadow-[0_0_28px_rgba(16,185,129,0.18)]"
      : neon === "fuchsia"
      ? "shadow-[0_0_28px_rgba(217,70,239,0.18)]"
      : "";
  return (
    <Card className={`p-4 bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/40 ${neonClass}`}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold">
        {value}
        {suffix ? <span className="text-base text-muted-foreground ml-1">{suffix}</span> : null}
      </div>
    </Card>
  );
}

function OrderLevels({ side, levels, market }: { side: Side; levels: QuoteLevel[]; market: Market }) {
  return (
    <div className="space-y-1">
      {levels.map((l, idx) => (
        <div
          key={idx}
          className={`flex items-center justify-between rounded border px-3 py-2 text-sm ${
            side === "BID" ? "bg-emerald-500/5 border-emerald-500/20" : "bg-fuchsia-500/5 border-fuchsia-500/20"
          }`}
        >
          <span className={side === "BID" ? "text-emerald-300" : "text-fuchsia-300"}>
            {fmtPx(l.price, market)}
          </span>
          <span className="text-muted-foreground">{l.size}</span>
        </div>
      ))}
    </div>
  );
}

// ---- Utils ----
function randn() {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function clamp(x: number, min: number, max: number) {
  return Math.max(min, Math.min(max, x));
}

function avg(arr: number[]) {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function stddev(arr: number[], mu?: number) {
  if (arr.length < 2) return 0;
  const mean = mu ?? avg(arr);
  const v = avg(arr.map((x) => (x - mean) * (x - mean)));
  return Math.sqrt(v);
}

function roundPx(px: number, mkt: Market) {
  const step = mkt === "SEI/USDC" ? 0.0001 : 0.1;
  return Math.round(px / step) * step;
}

function fmtPx(px: number, mkt: Market) {
  return mkt === "SEI/USDC" ? px.toFixed(4) : px.toFixed(1);
}

function fmtUsd(v: number) {
  const sign = v < 0 ? "-" : "";
  const n = Math.abs(v);
  return `${sign}$${n.toFixed(2)}`;
}

function pct(x: number) {
  return `${(x * 100).toFixed(0)}%`;
}