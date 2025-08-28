export const CONFIG = {
  NETWORK_NAME: process.env.NEXT_PUBLIC_NETWORK_NAME ?? "Sei Testnet",
  CHAIN_ID: process.env.NEXT_PUBLIC_CHAIN_ID ?? "atlantic-2",
  RPC_URL: process.env.NEXT_PUBLIC_SEI_RPC_URL ?? "https://rpc.atlantic-2.seinetwork.io",
  REST_URL: process.env.NEXT_PUBLIC_SEI_REST_URL ?? "https://rest.atlantic-2.seinetwork.io",
  CLOB_WS_URL: process.env.NEXT_PUBLIC_SEI_WS_URL ?? "wss://rpc.atlantic-2.seinetwork.io/websocket",
  ROUTER_URL: process.env.NEXT_PUBLIC_ROUTER_URL ?? "/api/orders",
  HEALTH_URL: process.env.NEXT_PUBLIC_HEALTH_URL ?? "/api/health",
  FAUCET_URL: process.env.NEXT_PUBLIC_FAUCET_URL ?? "https://faucet.ping.pub/sei",
  EXPLORER_URL: process.env.NEXT_PUBLIC_EXPLORER_URL ?? "https://www.mintscan.io/sei-testnet",
  MARKETS: (process.env.NEXT_PUBLIC_MARKETS ?? "SEI/USDC,wETH/USDC")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
};