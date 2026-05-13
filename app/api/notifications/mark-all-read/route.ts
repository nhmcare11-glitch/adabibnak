import { markAllNotificationsAsRead } from "@/actions/notifications";
import { NextResponse } from "next/server";

export async function POST() {
  await markAllNotificationsAsRead();
  return NextResponse.json({ success: true });
}
