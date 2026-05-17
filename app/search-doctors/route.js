import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";

// Helper to get current user
async function getCurrentUser() {
  try {
    const { userId } = await auth();
    if (!userId) return null;

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    return user;
  } catch (error) {
    console.error("[API Conversations] Auth error:", error);
    return null;
  }
}

// POST /api/chat/conversations - Create or get conversation
export async function POST(request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { doctorId } = body;

    if (!doctorId) {
      return NextResponse.json({ error: "Doctor ID required" }, { status: 400 });
    }

    const patientId = currentUser.role === "PATIENT" ? currentUser.id : doctorId;
    const resolvedDoctorId = currentUser.role === "DOCTOR" ? currentUser.id : doctorId;

    let conversation = await db.conversation.findUnique({
      where: {
        doctorId_patientId: {
          doctorId: resolvedDoctorId,
          patientId: patientId,
        },
      },
      include: {
        doctor: { select: { id: true, name: true, imageUrl: true, specialty: true } },
        patient: { select: { id: true, name: true, imageUrl: true } },
      },
    });

    if (!conversation) {
      conversation = await db.conversation.create({
        data: {
          doctorId: resolvedDoctorId,
          patientId: patientId,
        },
        include: {
          doctor: { select: { id: true, name: true, imageUrl: true, specialty: true } },
          patient: { select: { id: true, name: true, imageUrl: true } },
        },
      });
    }

    return NextResponse.json({ conversation });
  } catch (error) {
    console.error("[API Conversations] POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}