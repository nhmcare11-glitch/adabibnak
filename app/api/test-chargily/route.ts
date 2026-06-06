import { NextResponse } from "next/server";
import { chargilyClient } from "@/lib/chargily";

export async function GET() {
  try {
    const balance = await chargilyClient.getBalance();
    return NextResponse.json({ success: true, balance });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message });
  }
}