"use client";

import * as React from "react";

export function useWalletSession() {
  const [address, setAddress] = React.useState<string | null>(null);
  const [walletName, setWalletName] = React.useState<string | null>(null);

  React.useEffect(() => {
    try {
      const a = sessionStorage.getItem("flashmm.wallet.address");
      const n = sessionStorage.getItem("flashmm.wallet.name");
      setAddress(a ? JSON.parse(a) : null);
      setWalletName(n ? JSON.parse(n) : null);
    } catch {
      // ignore parse errors
    }

    const onStorage = (e: StorageEvent) => {
      if (e.storageArea !== sessionStorage) return;
      if (e.key === "flashmm.wallet.address" || e.key === "flashmm.wallet.name") {
        try {
          const a = sessionStorage.getItem("flashmm.wallet.address");
          const n = sessionStorage.getItem("flashmm.wallet.name");
          setAddress(a ? JSON.parse(a) : null);
          setWalletName(n ? JSON.parse(n) : null);
        } catch {
          // ignore
        }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return { address, walletName };
}