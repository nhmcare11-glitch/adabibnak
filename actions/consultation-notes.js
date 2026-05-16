"use server";

import { db } from "@/lib/prisma";  // ✅ غيّر prisma إلى db
import { revalidatePath } from "next/cache";

export async function getConsultationNotes(appointmentId) {
  try {
    const notes = await db.consultationNote.findUnique({  // ✅ غيّر prisma إلى db
      where: { appointmentId },
    });
    return { success: true, notes };
  } catch (error) {
    return { success: false, error: "Failed to fetch notes" };
  }
}

export async function saveConsultationNotes(data) {
  try {
    const notes = await db.consultationNote.upsert({  // ✅ غيّر prisma إلى db
      where: { appointmentId: data.appointmentId },
      update: {
        symptoms: data.symptoms,
        diagnosis: data.diagnosis,
        recommendations: data.recommendations,
        prescriptionNotes: data.prescriptionNotes,
        updatedAt: new Date(),
      },
      create: {
        appointmentId: data.appointmentId,
        doctorId: data.doctorId,
        patientId: data.patientId,
        symptoms: data.symptoms,
        diagnosis: data.diagnosis,
        recommendations: data.recommendations,
        prescriptionNotes: data.prescriptionNotes,
      },
    });
    revalidatePath("/doctor-dashboard");
    return { success: true, notes };
  } catch (error) {
    return { success: false, error: "Failed to save notes" };
  }
}

export async function getPatientNotesForDoctor(patientId) {
  try {
    const notes = await db.consultationNote.findMany({  // ✅ غيّر prisma إلى db
      where: { patientId },
      include: { appointment: true },
      orderBy: { createdAt: "desc" },
    });
    return { success: true, notes };
  } catch (error) {
    return { success: false, error: "Failed to fetch patient notes" };
  }
}