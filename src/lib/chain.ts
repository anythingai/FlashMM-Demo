"use client";

import { CONFIG } from "@/lib/config";

type Coin = { denom: string; amount: string };

interface KeplrWindow {
  keplr?: {
    experimentalSuggestChain?: (chainInfo: unknown) => Promise<void>;
  };
}

export async function suggestChainKeplr(): Promise<boolean> {
  const windowKeplr = window as unknown as KeplrWindow;
  if (!windowKeplr?.keplr?.experimentalSuggestChain) return false;
  try {
    // Minimal suggest; projects should supply full fee currencies & chain params.
    await windowKeplr.keplr.experimentalSuggestChain({
      chainId: CONFIG.CHAIN_ID,
      chainName: CONFIG.NETWORK_NAME,
      rpc: CONFIG.RPC_URL,
      rest: CONFIG.REST_URL,
      bip44: { coinType: 118 },
      bech32Config: {
        bech32PrefixAccAddr: "sei",
        bech32PrefixAccPub: "seipub",
        bech32PrefixValAddr: "seivaloper",
        bech32PrefixValPub: "seivaloperpub",
        bech32PrefixConsAddr: "seivalcons",
        bech32PrefixConsPub: "seivalconspub",
      },
      stakeCurrency: { coinDenom: "SEI", coinMinimalDenom: "usei", coinDecimals: 6 },
      currencies: [
        { coinDenom: "SEI", coinMinimalDenom: "usei", coinDecimals: 6 },
      ],
      feeCurrencies: [
        { coinDenom: "SEI", coinMinimalDenom: "usei", coinDecimals: 6 },
      ],
      features: ["cosmwasm", "ibc-transfer"],
    });
    return true;
  } catch {
    return false;
  }
}

export async function getLatestBlockHeight(): Promise<number | null> {
  try {
    const res = await fetch(`${CONFIG.REST_URL}/blocks/latest`, { cache: "no-store" });
    if (!res.ok) return null;
    const json = await res.json();
    const height = Number(json?.block?.header?.height ?? json?.block?.header?.height);
    return Number.isFinite(height) ? height : null;
  } catch {
    return null;
  }
}

export async function pingLatency(url: string, timeoutMs = 1500): Promise<number | null> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    const start = performance.now();
    const res = await fetch(url, { signal: ctrl.signal, cache: "no-store" });
    clearTimeout(t);
    if (!res.ok) return null;
    return Math.round(performance.now() - start);
  } catch {
    return null;
  }
}

export async function getBalances(addr: string): Promise<Coin[] | null> {
  try {
    const res = await fetch(`${CONFIG.REST_URL}/cosmos/bank/v1beta1/balances/${addr}`, { cache: "no-store" });
    if (!res.ok) return null;
    const json = await res.json();
    return Array.isArray(json?.balances) ? (json.balances as Coin[]) : [];
  } catch {
    return null;
  }
}

export function formatAmount(coins: Coin[] | null | undefined, minimalDenom = "usei", decimals = 6): string {
  if (!coins) return "0";
  const c = coins.find((x) => x.denom === minimalDenom);
  if (!c) return "0";
  const n = Number(c.amount) / 10 ** decimals;
  return n.toFixed(2);
}