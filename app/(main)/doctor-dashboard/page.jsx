import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/prisma";
import DoctorDashboardClient from "./_components/doctor-dashboard-client";
import FaceProtection from "@/components/doctor/FaceProtection";
import VideoCallNotification from "@/components/VideoCallNotification";

export default async function DoctorDashboardPage() {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) redirect("/sign-in");

  const user = await db.user.findUnique({
    where: { clerkUserId },
    include: {
      availabilities: { orderBy: { startTime: "asc" } },
      doctorAppointments: {
        include: {
          patient: {
            select: { id: true, name: true, email: true, imageUrl: true, patientProfile: true }
          },
          payment: { include: { approvedBy: { select: { name: true, role: true } } } },
          prescription: true
        },
        orderBy: { startTime: "asc" }
      },
      doctorConversations: {
        include: {
          patient: { select: { id: true, name: true, imageUrl: true } },
          messages: { orderBy: { createdAt: "desc" }, take: 1 }
        }
      },
      notifications: { where: { isRead: false }, orderBy: { createdAt: "desc" } }
    }
  });

  if (!user) redirect("/onboarding");
  if (user.role !== "DOCTOR") redirect("/");

  const verification = await db.doctorFaceVerification.findUnique({
    where: { doctorId: user.id },
  });
  if (!verification || !verification.isVerified) redirect("/doctor/verification");

  // ✅ Check for active video call (if patient joined first)
  const activeVideoCall = user.doctorAppointments.find(
    a => a.status === "ONGOING" && a.videoCallStatus === "PATIENT_JOINED"
  );

  const availabilitySlots = user.availabilities || [];
  const appointments = user.doctorAppointments.map(appt => ({
    id: appt.id,
    patientId: appt.patientId,
    doctorId: appt.doctorId,
    startTime: appt.startTime,
    endTime: appt.endTime,
    status: appt.status,
    notes: appt.notes,
    patientDescription: appt.patientDescription,
    videoSessionId: appt.videoSessionId,
    videoSessionToken: appt.videoSessionToken,
    createdAt: appt.createdAt,
    updatedAt: appt.updatedAt,
    cancellationReason: appt.cancellationReason,
    rating: appt.rating,
    consultationType: appt.consultationType,
    duration: appt.duration,
    patient: appt.patient,
    payment: appt.payment,
    prescription: appt.prescription,
  }));
  const conversations = user.doctorConversations.map(conv => ({
    id: conv.id,
    patientId: conv.patientId,
    doctorId: conv.doctorId,
    patient: conv.patient,
    lastMessage: conv.messages[0]?.content || conv.lastMessage || "",
    updatedAt: conv.updatedAt,
    createdAt: conv.createdAt,
  }));
  const notifications = user.notifications || [];

  return (
    <>
      <FaceProtection />
      {/* ✅ Video Call Notification for Doctor (if patient joined first) */}
      {activeVideoCall && (
        <VideoCallNotification
          appointmentId={activeVideoCall.id}
          sessionId={activeVideoCall.videoSessionId}
        />
      )}
      <DoctorDashboardClient
        user={{
          id: user.id,
          name: user.name,
          email: user.email,
          imageUrl: user.imageUrl,
          specialty: user.specialty,
          verificationStatus: user.verificationStatus,
          role: user.role,
        }}
        appointments={appointments}
        availabilitySlots={availabilitySlots}
        conversations={conversations}
        notifications={notifications}
      />
    </>
  );
}