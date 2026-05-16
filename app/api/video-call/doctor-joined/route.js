import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { createNotification } from "@/actions/notifications";

export async function POST(request) {
  try {
    const { appointmentId } = await request.json();

    if (!appointmentId) {
      return NextResponse.json({ error: "Appointment ID required" }, { status: 400 });
    }

    // Find appointment with doctor info
    const appointment = await db.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: { select: { id: true, name: true } },
        doctor: { select: { id: true, name: true } },
      },
    });

    if (!appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    // Update status to DOCTOR_JOINED
    await db.appointment.update({
      where: { id: appointmentId },
      data: {
        status: "ONGOING",
        videoCallStatus: "DOCTOR_JOINED",
      },
    });

    // Create notification for patient
    try {
      await createNotification({
        userId: appointment.patientId,
        type: "VIDEO_CALL_STARTED",
        title: "📹 الطبيب في الاستشارة",
        message: `د. ${appointment.doctor.name} دخل غرفة الاستشارة. انقر للانضمام الآن.`,
        link: `/video-call?appointmentId=${appointmentId}`,
        metadata: {
          appointmentId,
          sessionId: appointment.videoSessionId,
          doctorId: appointment.doctorId,
        },
      });
    } catch (notifError) {
      console.error("Notification error:", notifError);
    }

    return NextResponse.json({ 
      success: true, 
      message: "Doctor joined successfully" 
    });
  } catch (error) {
    console.error("API doctor-joined error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}