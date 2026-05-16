"use server";

import { db } from "@/lib/prisma";  // ✅ غيّر prisma إلى db
import { revalidatePath } from "next/cache";

export async function getMedicalRecord(userId) {
  try {
    const record = await db.medicalRecord.findUnique({  // ✅ غيّر prisma إلى db
      where: { userId },
    });
    return { success: true, record };
  } catch (error) {
    console.error("getMedicalRecord error:", error);
    return { success: false, error: "Failed to fetch medical record" };
  }
}

export async function createOrUpdateMedicalRecord(data) {
  try {
    const record = await db.medicalRecord.upsert({  // ✅ غيّر prisma إلى db
      where: { userId: data.userId },
      update: {
        firstName: data.firstName,
        lastName: data.lastName,
        gender: data.gender,
        dateOfBirth: data.dateOfBirth,
        age: data.age,
        phone: data.phone,
        email: data.email,
        bloodType: data.bloodType,
        weight: data.weight,
        height: data.height,
        chronicDiseases: data.chronicDiseases,
        allergies: data.allergies,
        previousSurgeries: data.previousSurgeries,
        currentMedications: data.currentMedications,
        smokingStatus: data.smokingStatus,
        pregnancyStatus: data.pregnancyStatus,
        familyDiseases: data.familyDiseases,
        updatedAt: new Date(),
      },
      create: {
        userId: data.userId,
        firstName: data.firstName,
        lastName: data.lastName,
        gender: data.gender,
        dateOfBirth: data.dateOfBirth,
        age: data.age,
        phone: data.phone,
        email: data.email,
        bloodType: data.bloodType,
        weight: data.weight,
        height: data.height,
        chronicDiseases: data.chronicDiseases,
        allergies: data.allergies,
        previousSurgeries: data.previousSurgeries,
        currentMedications: data.currentMedications,
        smokingStatus: data.smokingStatus,
        pregnancyStatus: data.pregnancyStatus,
        familyDiseases: data.familyDiseases,
      },
    });
    revalidatePath("/patient-dashboard");
    return { success: true, record };
  } catch (error) {
    console.error("createOrUpdateMedicalRecord error:", error);
    return { success: false, error: "Failed to save medical record" };
  }
}