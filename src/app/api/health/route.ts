export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    name: "FlashMM Agent",
    status: "ok",
    network: "Sei V2 testnet",
    timestamp: new Date().toISOString(),
  });
}