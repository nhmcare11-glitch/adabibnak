"use server";

import { db } from "@/lib/prisma";

/**
 * Get doctors by specialty
 */
export async function getDoctorsBySpecialty(specialty) {
  try {
    const decodedSpecialty = decodeURIComponent(specialty);
    console.log("=== SPECIALTY FROM URL:", JSON.stringify(decodedSpecialty));

    // مؤقت باش نشوف كل الأطباء وتخصصاتهم
    const allDoctors = await db.user.findMany({ where: { role: "DOCTOR" } });
    console.log("=== ALL DOCTORS SPECIALTIES:", allDoctors.map(d => JSON.stringify(d.specialty)));

    const doctors = await db.user.findMany({
      where: {
        role: "DOCTOR",
        verificationStatus: "VERIFIED",
        specialty: decodedSpecialty,
      },
      orderBy: {
        name: "asc",
      },
    });

    console.log("=== FOUND DOCTORS COUNT:", doctors.length);

    return { doctors };
  } catch (error) {
    console.error("Failed to fetch doctors by specialty:", error);
    return { error: "Failed to fetch doctors" };
  }
}
