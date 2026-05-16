import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export async function POST(request) {
  try {
    const { appointmentId } = await request.json();

    if (!appointmentId) {
      return NextResponse.json({ error: "Appointment ID required" }, { status: 400 });
    }

    const appointment = await db.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    await db.appointment.update({
      where: { id: appointmentId },
      data: {
        status: "COMPLETED",
        videoCallStatus: "ENDED",
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("API end error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}