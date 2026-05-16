import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const appointmentId = searchParams.get("appointmentId");

    if (!appointmentId) {
      return NextResponse.json({ error: "Appointment ID required" }, { status: 400 });
    }

    const appointment = await db.appointment.findUnique({
      where: { id: appointmentId },
      select: {
        id: true,
        videoCallStatus: true,
        videoSessionId: true,
        status: true,
        doctorId: true,
        patientId: true,
      },
    });

    if (!appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    return NextResponse.json({
      status: appointment.status,
      videoCallStatus: appointment.videoCallStatus,
      sessionId: appointment.videoSessionId,
      doctorJoined: appointment.videoCallStatus === "DOCTOR_JOINED" || 
                    appointment.videoCallStatus === "IN_PROGRESS",
      inProgress: appointment.videoCallStatus === "IN_PROGRESS",
      ended: appointment.videoCallStatus === "ENDED" || appointment.status === "COMPLETED",
    });
  } catch (error) {
    console.error("API check-status error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}