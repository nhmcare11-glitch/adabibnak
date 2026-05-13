import { getMyNotifications } from "@/actions/notifications";
import { NextResponse } from "next/server";

export async function GET() {
  const { notifications, unreadCount } = await getMyNotifications();
  return NextResponse.json({ success: true, notifications, unreadCount });
}