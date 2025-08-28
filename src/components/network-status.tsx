"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { CONFIG } from "@/lib/config";

export function NetworkStatus() {
  const [latency, setLatency] = React.useState<number | null>(null);
  const [height, setHeight] = React.useState<number | null>(null);

  React.useEffect(() => {
    const run = async () => {
      try {
        // Use local health endpoint instead of external REST API
        const start = performance.now();
        const res = await fetch("/api/health", { cache: "no-store" });
        const duration = Math.round(performance.now() - start);
        
        if (res.ok) {
          setLatency(duration);
          // Mock block height that increments
          setHeight(prev => (prev || 12500000) + Math.floor(Math.random() * 3));
        } else {
          setLatency(null);
        }
      } catch {
        setLatency(null);
      }
    };
    run();
    const id: NodeJS.Timeout = setInterval(run, 5000);
    return () => clearInterval(id);
  }, []);

  const healthy = typeof latency === "number" && latency < 800 && (height ?? 0) > 0;

  return (
    <Badge
      variant="secondary"
      className={`gap-2 ${healthy ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30" : "bg-amber-500/10 text-amber-300 border-amber-500/30"}`}
      title={`Network: ${CONFIG.NETWORK_NAME}`}
    >
      <span
        className={`inline-block h-2 w-2 rounded-full ${
          healthy ? "bg-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.6)]" : "bg-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.6)]"
        }`}
      />
      {latency != null ? `${latency}ms` : "…"} {height ? `• #${height}` : ""}
    </Badge>
  );
}