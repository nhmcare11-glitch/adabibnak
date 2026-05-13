import { markNotificationAsRead } from "@/actions/notifications";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { notificationId } = await request.json();
  await markNotificationAsRead(notificationId);
  return NextResponse.json({ success: true });
}