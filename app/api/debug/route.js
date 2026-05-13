import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "غير مسجل دخول" }, { status: 401 });
    }
    
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
      select: { role: true }
    });
    
    if (user?.role !== "ADMIN") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }
    
    const doctors = await db.user.findMany({
      where: { role: "DOCTOR" },
      select: { id: true, name: true, email: true, verificationStatus: true }
    });
    
    const patients = await db.user.findMany({
      where: { role: "PATIENT" },
      select: { id: true, name: true }
    });
    
    const doctorsCount = doctors.length;
    const patientsCount = patients.length;
    
    return NextResponse.json({
      success: true,
      doctorsCount,
      patientsCount,
      doctors,
      patients
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}