"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

// ─────────────────────────────────────────────
// Verify Verification Manager
// ─────────────────────────────────────────────
export async function verifyVerificationManager() {
  return true;
}

// ─────────────────────────────────────────────
// Stats
// ─────────────────────────────────────────────
export async function getVerificationStats() {
  const total = await db.user.count({
    where: {
      role: "DOCTOR",
    },
  });

  const pending = await db.user.count({
    where: {
      role: "DOCTOR",
      verificationStatus: "PENDING",
    },
  });

  const verified = await db.user.count({
    where: {
      role: "DOCTOR",
      verificationStatus: "VERIFIED",
    },
  });

  const rejected = await db.user.count({
    where: {
      role: "DOCTOR",
      verificationStatus: "REJECTED",
    },
  });

  return {
    total,
    pending,
    verified,
    rejected,
  };
}

// ─────────────────────────────────────────────
// Pending Doctors
// ─────────────────────────────────────────────
export async function getPendingDoctorsVM() {
  return await db.user.findMany({
    where: {
      role: "DOCTOR",
      verificationStatus: "PENDING",
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

// ─────────────────────────────────────────────
// Verified Doctors
// ─────────────────────────────────────────────
export async function getVerifiedDoctorsVM() {
  return await db.user.findMany({
    where: {
      role: "DOCTOR",
      verificationStatus: "VERIFIED",
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

// ─────────────────────────────────────────────
// Rejected Doctors
// ─────────────────────────────────────────────
export async function getRejectedDoctorsVM() {
  return await db.user.findMany({
    where: {
      role: "DOCTOR",
      verificationStatus: "REJECTED",
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

// ─────────────────────────────────────────────
// Approve Doctor
// ─────────────────────────────────────────────
export async function approveDoctorVM(formData) {
  try {
    const doctorId = formData.get("doctorId");

    if (!doctorId) {
      return {
        success: false,
        error: "Doctor ID missing",
      };
    }

    await db.user.update({
      where: {
        id: String(doctorId),
      },
      data: {
        verificationStatus: "VERIFIED",
        rejectionReason: null,
        verifiedAt: new Date(),
      },
    });

    revalidatePath("/verification-manager");

    return {
      success: true,
    };
  } catch (error) {
    console.error("APPROVE_DOCTOR_VM_ERROR:", error);

    return {
      success: false,
      error: "حدث خطأ أثناء القبول",
    };
  }
}

// ─────────────────────────────────────────────
// Reject Doctor
// ─────────────────────────────────────────────
export async function rejectDoctorVM(formData) {
  try {
    const doctorId = formData.get("doctorId");
    const reason = formData.get("reason");

    if (!doctorId) {
      return {
        success: false,
        error: "Doctor ID missing",
      };
    }

    await db.user.update({
      where: {
        id: String(doctorId),
      },
      data: {
        verificationStatus: "REJECTED",
        rejectionReason: String(reason || ""),
      },
    });

    revalidatePath("/verification-manager");

    return {
      success: true,
    };
  } catch (error) {
    console.error("REJECT_DOCTOR_VM_ERROR:", error);

    return {
      success: false,
      error: "حدث خطأ أثناء الرفض",
    };
  }
}