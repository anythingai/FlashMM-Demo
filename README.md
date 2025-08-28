# FlashMM — Predictive On‑Chain Market‑Making Agent (Sei Testnet)

An AI‑assisted, latency‑sensitive quoting agent designed for Sei’s CLOB. This repository includes a production‑style operator UI, real‑time metrics, risk controls, and router activity endpoints suitable for presenting the full userflow on Sei testnet.

- Tech stack: Next.js (App Router), Tailwind v4, shadcn/ui, next-themes, TypeScript
- UX: Dark-by-default, neon accents (emerald/fuchsia), glass-like surfaces
- Frequency: 5 Hz loop with inventory and risk controls
- Routes:
  - App: http://localhost:3000
  - Dashboard: http://localhost:3000/dashboard
  - Health: http://localhost:3000/api/health
  - Router Activity: http://localhost:3000/api/orders

PRD reference: ../prd.md


## Quick Start

1) Install dependencies
```
npm install
```

2) Start the app
```
npm run dev
```

3) Open the UI
- Landing: http://localhost:3000
- Dashboard: http://localhost:3000/dashboard


## Operator Walkthrough (Happy Path)

Drive the full userflow from the Dashboard. The top “Agent” panel provides explicit step controls; each step unlocks the next and the UI reflects state immediately.

1) Connect to Sei CLOB (WS)
   - Click “Connect”. The WS badge turns “Connected”.

2) Start order‑book + trades stream
   - Click “Start Stream”. KPIs begin updating with live latency figures.

3) Normalize data
   - Click “Normalize”. The model input path is marked ready.

4) Start prediction loop (5 Hz)
   - Click “Start Prediction”. Confidence updates every tick and influences quoting.

5) Start quoting (3 levels/side)
   - Click “Start Quoting”.
   - Order book levels render; spreads/levels adapt; fills appear in “Recent Fills”.
   - PnL (MTM) responds as trades are recorded.

6) Bind order router
   - Click “Bind Router”.
   - The engine sends compact snapshots of market state/quotes to the Router Activity endpoint.

7) Enable telemetry
   - Click “Enable Telemetry”.
   - “Order Router — Recent Activity” populates from /api/orders.

8) Arm failsafe (kill‑switch)
   - Click “Arm Failsafe”.
   - On extreme volatility events, the engine will auto‑pause to protect inventory.

Controls available at all times:
- Pause/Resume engine
- Switch market: SEI/USDC vs wETH/USDC (different tick/volatility regimes)


## What You’ll See

- KPIs: Mid Price, Spread %, PnL (MTM), Latency (ms)
- Order Book (Top 3): Bid/Ask levels visible while quoting is active
- Recent Fills: Buy/Sell prints with timestamp and size
- Inventory & Risk: Position, notional %, progress bar toward limit, and auto‑widening indication
- Router Activity: Recent snapshots showing market, mid, confidence, best bid/ask
- Social Update: Shareable text summary block


## Architecture Overview

- Frontend Application
  - Next.js + Tailwind + shadcn/ui
  - Layout with theme toggle and web3 aesthetic
  - Operator‑first Dashboard page coordinating all states

- Engine Loop (5 Hz)
  - Maintains mid, confidence, spread/levels, fills, inventory, and PnL
  - Inventory mean‑reversion; auto‑widening on exposure/volatility
  - Kill‑switch that can pause on abnormal conditions

- Router Activity Endpoint
  - API: src/app/api/orders/route.ts
  - Accepts compact snapshots from the engine and serves recent activity for the UI

- Health Endpoint
  - API: src/app/api/health/route.ts
  - Returns app/system status JSON


## Files of Interest

- Layout/Theme: src/app/layout.tsx
- Landing: src/app/page.tsx
- Dashboard (engine + UI): src/app/dashboard/page.tsx
- Agent operator panel: src/components/agent/agent-status.tsx
- Health API: src/app/api/health/route.ts
- Router Activity API: src/app/api/orders/route.ts


## KPIs / Targets (per PRD)

- Average bid‑ask spread: tighter relative to baseline
- Maker ROI (daily): ≥ 0.2%
- Prediction direction hit‑rate @ 100–500 ms
- Uptime: operational through judging window


## Scripts

- Dev: `npm run dev`
- Build: `npm run build`
- Start: `npm start`
- Lint: `npm run lint`


## License

MIT — see LICENSE


## References

- Sei CLOB API docs: https://docs.sei.io/core/clob
- Cambrian SDK (Python): https://github.com/cambrian-code/python-sdk
