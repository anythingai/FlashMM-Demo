"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSessionState } from "@/hooks/use-session-state";
import { CONFIG } from "@/lib/config";
import { suggestChainKeplr } from "@/lib/chain";
import { toast } from "sonner";

interface KeplrWallet {
  enable: (chainId: string) => Promise<void>;
  experimentalSuggestChain?: (chainInfo: unknown) => Promise<void>;
}

interface LeapWallet {
  enable?: (chainId: string) => Promise<void>;
}

interface OfflineSigner {
  getAccounts: () => Promise<Array<{ address: string }>>;
}

declare global {
  interface Window {
    keplr?: KeplrWallet;
    leap?: LeapWallet;
    getOfflineSigner?: (chainId: string) => OfflineSigner;
  }
}

function truncate(addr: string, left = 8, right = 6) {
  if (!addr) return "";
  if (addr.length <= left + right) return addr;
  return `${addr.slice(0, left)}…${addr.slice(-right)}`;
}

export function WalletButton() {
  const [mounted, setMounted] = React.useState(false);
  const [connecting, setConnecting] = React.useState(false);
  const [address, setAddress] = useSessionState<string | null>("flashmm.wallet.address", null);
  const [walletName, setWalletName] = useSessionState<string | null>("flashmm.wallet.name", null);

  React.useEffect(() => setMounted(true), []);

  async function connectKeplr() {
    const chainId = CONFIG.CHAIN_ID;
    if (!window.keplr || !window.getOfflineSigner) {
      throw new Error("Keplr not detected");
    }
    // Suggest chain (if not preconfigured), then enable it.
    const suggested = await suggestChainKeplr();
    if (!suggested) {
      // Even if suggestion API is unavailable, try enabling directly.
    }
    await window.keplr.enable(chainId);
    const signer = window.getOfflineSigner(chainId);
    const accounts = await signer.getAccounts();
    if (!accounts?.length) throw new Error("No accounts found");
    setAddress(accounts[0].address);
    setWalletName("Keplr");
    toast.success(`Connected to Keplr wallet`);
  }

  async function connectLeap() {
    const chainId = CONFIG.CHAIN_ID;
    if (!window.leap || !window.getOfflineSigner) {
      throw new Error("Leap not detected");
    }
    if (window.leap.enable) {
      await window.leap.enable(chainId);
    }
    const signer = window.getOfflineSigner(chainId);
    const accounts = await signer.getAccounts();
    if (!accounts?.length) throw new Error("No accounts found");
    setAddress(accounts[0].address);
    setWalletName("Leap");
    toast.success(`Connected to Leap wallet`);
  }

  async function onConnect() {
    setConnecting(true);
    try {
      if (window.keplr) {
        await connectKeplr();
      } else if (window.leap) {
        await connectLeap();
      } else {
        throw new Error("No compatible wallet detected (Keplr/Leap).");
      }
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : "Wallet connection failed";
      toast.error(message);
    } finally {
      setConnecting(false);
    }
  }

  function onDisconnect() {
    setAddress(null);
    setWalletName(null);
    toast.info("Wallet disconnected");
  }

  if (!mounted) {
    return (
      <Button variant="outline" size="sm" className="h-8 px-3" disabled>
        Wallet
      </Button>
    );
  }

  if (address) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-300 border-emerald-500/30">
          {walletName ?? "Wallet"}
        </Badge>
        <Button
          variant="outline"
          size="sm"
          className="h-8 px-3"
          onClick={() => {
            if (address && navigator?.clipboard?.writeText) {
              navigator.clipboard.writeText(address).then(() => {
                toast.success("Address copied to clipboard");
              }).catch(() => {
                toast.error("Failed to copy address");
              });
            }
          }}
          title="Click to copy address"
        >
          {truncate(address)}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-muted-foreground hover:text-foreground"
          onClick={onDisconnect}
          title="Disconnect"
        >
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="default"
        size="sm"
        className="h-8 px-3 shadow-[0_0_18px_rgba(16,185,129,0.18)]"
        onClick={onConnect}
        disabled={connecting}
      >
        {connecting ? "Connecting…" : "Connect Wallet"}
      </Button>
      <span className="text-xs text-muted-foreground hidden sm:inline">
        {CONFIG.NETWORK_NAME}
      </span>
    </div>
  );
}