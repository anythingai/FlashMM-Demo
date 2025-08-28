export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";

type OrderSnapshot = {
  ts: number;
  market: string;
  mid: number;
  predictedDelta: number;
  confidence: number;
  bestBid: { price: number; size: number } | null;
  bestAsk: { price: number; size: number } | null;
};

// Ephemeral in-memory store
const store: OrderSnapshot[] = [];

export async function GET() {
  // Return latest 20
  const data = store.slice(-20).reverse();
  return NextResponse.json({ ok: true, count: data.length, data });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<OrderSnapshot>;
    const item: OrderSnapshot = {
      ts: Date.now(),
      market: body.market ?? "SEI/USDC",
      mid: Number(body.mid ?? 0),
      predictedDelta: Number(body.predictedDelta ?? 0),
      confidence: Number(body.confidence ?? 0),
      bestBid: body.bestBid ?? null,
      bestAsk: body.bestAsk ?? null,
    };
    store.push(item);
    // keep reasonable cap
    if (store.length > 500) store.shift();
    return NextResponse.json({ ok: true, ack: item });
  } catch (e) {
    return NextResponse.json({ ok: false, error: "Bad JSON" }, { status: 400 });
  }
}