"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

// ⚠️ تمت إزالة getDoctorAvailability من هنا
// استخدم getDoctorAvailability من "@/actions/availability" بدلاً منها
// لأن النسختين كانتا تتعارضان وتسببان الخطأ في doctor-dashboard

/**
 * Get doctor's upcoming appointments
 */
export async function getDoctorAppointments() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  try {
    const doctor = await db.user.findUnique({
      where: { clerkUserId: userId, role: "DOCTOR" },
    });
    if (!doctor) throw new Error("Doctor not found");

    const appointments = await db.appointment.findMany({
      where: {
        doctorId: doctor.id,
        status:   { in: ["SCHEDULED"] },
      },
      include: { patient: true },
      orderBy: { startTime: "asc" },
    });

    return { appointments };
  } catch (error) {
    throw new Error("Failed to fetch appointments " + error.message);
  }
}

/**
 * Cancel an appointment
 */
export async function cancelAppointment(formData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  try {
    const user = await db.user.findUnique({ where: { clerkUserId: userId } });
    if (!user) throw new Error("User not found");

    const appointmentId = formData.get("appointmentId");
    if (!appointmentId) throw new Error("Appointment ID is required");

    const appointment = await db.appointment.findUnique({
      where: { id: appointmentId },
      include: { patient: true, doctor: true },
    });
    if (!appointment) throw new Error("Appointment not found");

    if (appointment.doctorId !== user.id && appointment.patientId !== user.id)
      throw new Error("You are not authorized to cancel this appointment");

    await db.appointment.update({
      where: { id: appointmentId },
      data:  { status: "CANCELLED" },
    });

    revalidatePath("/doctor-dashboard");
    revalidatePath("/patient-dashboard");

    return { success: true };
  } catch (error) {
    console.error("Failed to cancel appointment:", error);
    throw new Error("Failed to cancel appointment: " + error.message);
  }
}

/**
 * Add notes to an appointment
 */
export async function addAppointmentNotes(formData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  try {
    const doctor = await db.user.findUnique({
      where: { clerkUserId: userId, role: "DOCTOR" },
    });
    if (!doctor) throw new Error("Doctor not found");

    const appointmentId = formData.get("appointmentId");
    const notes         = formData.get("notes");
    if (!appointmentId || !notes) throw new Error("Appointment ID and notes are required");

    const appointment = await db.appointment.findUnique({
      where: { id: appointmentId, doctorId: doctor.id },
    });
    if (!appointment) throw new Error("Appointment not found");

    const updatedAppointment = await db.appointment.update({
      where: { id: appointmentId },
      data:  { notes },
    });

    revalidatePath("/doctor-dashboard");
    return { success: true, appointment: updatedAppointment };
  } catch (error) {
    console.error("Failed to add appointment notes:", error);
    throw new Error("Failed to update notes: " + error.message);
  }
}

/**
 * Mark an appointment as completed
 */
export async function markAppointmentCompleted(formData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  try {
    const doctor = await db.user.findUnique({
      where: { clerkUserId: userId, role: "DOCTOR" },
    });
    if (!doctor) throw new Error("Doctor not found");

    const appointmentId = formData.get("appointmentId");
    if (!appointmentId) throw new Error("Appointment ID is required");

    const appointment = await db.appointment.findUnique({
      where:   { id: appointmentId, doctorId: doctor.id },
      include: { patient: true },
    });
    if (!appointment) throw new Error("Appointment not found or not authorized");

    if (appointment.status !== "SCHEDULED")
      throw new Error("Only scheduled appointments can be marked as completed");

    const now = new Date();
    if (now < new Date(appointment.endTime))
      throw new Error("Cannot mark appointment as completed before the scheduled end time");

    const updatedAppointment = await db.appointment.update({
      where: { id: appointmentId },
      data:  { status: "COMPLETED" },
    });

    revalidatePath("/doctor-dashboard");
    return { success: true, appointment: updatedAppointment };
  } catch (error) {
    console.error("Failed to mark appointment as completed:", error);
    throw new Error("Failed to mark appointment as completed: " + error.message);
  }
}
