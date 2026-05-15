"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import {
  addDays,
  addMinutes,
  format,
  isBefore,
  endOfDay,
  startOfDay,
} from "date-fns";

import { createNotification } from "./notifications";

// ============================================================
// SMS — نستورد من lib/sms و lib/sms-messages
// ============================================================
import { sendSMS } from "@/lib/sms";
import {
  msgAppointmentBooked,
  msgNewAppointmentForDoctor,
} from "@/lib/sms-messages";

// ============================================================
// helper — جلب رقم هاتف المريض من PatientProfile
// ============================================================
async function getPatientPhone(patientId) {
  const profile = await db.patientProfile.findUnique({
    where: { userId: patientId },
    select: { phone: true },
  });
  return profile?.phone || null;
}

// ============================================================
// bookAppointment
// ============================================================
export async function bookAppointment(formData) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const doctorId = formData.get("doctorId");

  const startTime = new Date(
    formData.get("startTime")
  );

  const endTime = new Date(
    formData.get("endTime")
  );

  const description =
    formData.get("description") || null;

  const consultationType =
    formData.get("consultationType") ||
    "REMOTE";

  const duration = parseInt(
    formData.get("duration") || "30"
  );

  if (
    !doctorId ||
    !startTime ||
    !endTime
  ) {
    throw new Error("بيانات ناقصة");
  }

  try {
    const result = await db.$transaction(
      async (tx) => {
        // ============================================================
        // PATIENT
        // ============================================================
        const patient =
          await tx.user.findUnique({
            where: {
              clerkUserId: userId,
            },
          });

        if (!patient) {
          throw new Error(
            "المستخدم غير موجود"
          );
        }

        // إصلاح الحسابات القديمة
        if (
          patient.role ===
            "UNASSIGNED" ||
          !patient.role
        ) {
          await tx.user.update({
            where: {
              id: patient.id,
            },
            data: {
              role: "PATIENT",
            },
          });

          patient.role = "PATIENT";
        }

        if (
          patient.role !== "PATIENT"
        ) {
          throw new Error(
            "هذا الحساب ليس حساب مريض"
          );
        }

        // ============================================================
        // DOCTOR
        // ============================================================
        const doctor =
          await tx.user.findUnique({
            where: {
              id: doctorId,
            },
          });

        if (
          !doctor ||
          doctor.role !== "DOCTOR" ||
          doctor.verificationStatus !==
            "VERIFIED"
        ) {
          throw new Error(
            "الطبيب غير موجود أو غير موثّق"
          );
        }

        // ============================================================
        // DOUBLE BOOKING CHECK
        // ============================================================
        const overlap =
          await tx.appointment.findFirst({
            where: {
              doctorId,

              status: {
                in: [
                  "SCHEDULED",
                  "ONGOING",
                ],
              },

              OR: [
                {
                  startTime: {
                    lte: startTime,
                  },

                  endTime: {
                    gt: startTime,
                  },
                },

                {
                  startTime: {
                    lt: endTime,
                  },

                  endTime: {
                    gte: endTime,
                  },
                },

                {
                  startTime: {
                    gte: startTime,
                  },

                  endTime: {
                    lte: endTime,
                  },
                },
              ],
            },
          });

        if (overlap) {
          throw new Error(
            "هذا الوقت محجوز بالفعل"
          );
        }

        // ============================================================
        // CHECK AVAILABILITY
        // ============================================================
        const availabilitySlot =
          await tx.availability.findFirst({
            where: {
              doctorId,

              status: "AVAILABLE",

              startTime: {
                lte: startTime,
              },

              endTime: {
                gte: endTime,
              },
            },
          });

        if (!availabilitySlot) {
          throw new Error(
            "هذا الوقت غير متاح"
          );
        }

        // ============================================================
        // CREATE APPOINTMENT
        // ============================================================
        const appointment =
          await tx.appointment.create({
            data: {
              patientId: patient.id,

              doctorId: doctor.id,

              startTime,

              endTime,

              patientDescription:
                description,

              status: "SCHEDULED",

              consultationType,

              duration,

              videoSessionId: `${doctorId}-${Date.now()}`,
            },
          });

        // ============================================================
        // UPDATE AVAILABILITY
        // ============================================================
        await tx.availability.delete({
          where: {
            id: availabilitySlot.id,
          },
        });

        // الجزء الأول
        if (
          availabilitySlot.startTime <
          startTime
        ) {
          await tx.availability.create({
            data: {
              doctorId: doctor.id,

              startTime:
                availabilitySlot.startTime,

              endTime: startTime,

              status: "AVAILABLE",
            },
          });
        }

        // الجزء الثاني
        if (
          endTime <
          availabilitySlot.endTime
        ) {
          await tx.availability.create({
            data: {
              doctorId: doctor.id,

              startTime: endTime,

              endTime:
                availabilitySlot.endTime,

              status: "AVAILABLE",
            },
          });
        }

        return {
          appointment,
          patient,
          doctor,
        };
      }
    );

    // ============================================================
    // NOTIFICATIONS (in-app) — نفس الكود القديم
    // ============================================================
    await Promise.all([
      createNotification({
        userId: result.doctor.id,

        type:
          "NEW_APPOINTMENT_BOOKED",

        title: "📅 موعد جديد",

        message: `موعد جديد مع ${
          result.patient.name
        } — ${format(
          startTime,
          "yyyy/MM/dd"
        )} الساعة ${format(
          startTime,
          "HH:mm"
        )}`,

        link: "/doctor-dashboard",

        metadata: {
          appointmentId:
            result.appointment.id,
        },
      }),

      createNotification({
        userId: result.patient.id,

        type:
          "APPOINTMENT_BOOKED",

        title: "✅ تم حجز موعدك",

        message: `موعدك مع د. ${
          result.doctor.name
        } — ${format(
          startTime,
          "yyyy/MM/dd"
        )} الساعة ${format(
          startTime,
          "HH:mm"
        )}`,

        link: "/patient-dashboard",

        metadata: {
          appointmentId:
            result.appointment.id,
        },
      }),
    ]);

    // ============================================================
    // SMS — نرسل بعد نجاح كل شي
    // نجيب رقم المريض من PatientProfile
    // ============================================================
    const patientPhone = await getPatientPhone(result.patient.id);

    if (patientPhone) {
      // SMS للمريض
      await sendSMS(
        patientPhone,
        msgAppointmentBooked({
          patientName: result.patient.name || "المريض",
          doctorName: result.doctor.name || "الطبيب",
          startTime,
        })
      );
    }

    // SMS للطبيب — نجيب رقمه من PatientProfile إن وجد
    // (الطبيب ممكن يكون عنده profile مستقبلاً، حالياً نتجاهل إن ما كانش)
    const doctorPhone = await getPatientPhone(result.doctor.id);
    if (doctorPhone) {
      await sendSMS(
        doctorPhone,
        msgNewAppointmentForDoctor({
          doctorName: result.doctor.name || "الطبيب",
          patientName: result.patient.name || "المريض",
          startTime,
        })
      );
    }

    // ============================================================
    // REVALIDATE
    // ============================================================
    revalidatePath(
      "/doctor-dashboard"
    );

    revalidatePath(
      "/patient-dashboard"
    );

    revalidatePath("/doctors");

    return {
      success: true,
      appointment:
        result.appointment,
    };
  } catch (error) {
    console.error(
      "BOOK APPOINTMENT ERROR:",
      error
    );

    throw new Error(
      error.message ||
        "فشل حجز الموعد"
    );
  }
}

// ============================================================
// getAvailableTimeSlots
// ============================================================
export async function getAvailableTimeSlots(
  doctorId,
  durationMinutes = 30
) {
  try {
    const doctor =
      await db.user.findUnique({
        where: {
          id: doctorId,
        },
      });

    if (
      !doctor ||
      doctor.role !== "DOCTOR" ||
      doctor.verificationStatus !==
        "VERIFIED"
    ) {
      throw new Error(
        "الطبيب غير موجود"
      );
    }

    const now = new Date();

    const todayStart =
      startOfDay(now);

    const rangeEnd = endOfDay(
      addDays(now, 6)
    );

    const allAvailability =
      await db.availability.findMany({
        where: {
          doctorId: doctor.id,

          status: "AVAILABLE",

          startTime: {
            gte: todayStart,
            lte: rangeEnd,
          },
        },

        orderBy: {
          startTime: "asc",
        },
      });

    const bookedAppointments =
      await db.appointment.findMany({
        where: {
          doctorId: doctor.id,

          status: {
            in: [
              "SCHEDULED",
              "ONGOING",
            ],
          },

          startTime: {
            gte: todayStart,
          },
        },

        select: {
          startTime: true,
          endTime: true,
        },
      });

    const daysWithSlots = {};

    for (const block of allAvailability) {
      const blockStart = new Date(
        block.startTime
      );

      const blockEnd = new Date(
        block.endTime
      );

      const dayKey = format(
        blockStart,
        "yyyy-MM-dd"
      );

      if (!daysWithSlots[dayKey]) {
        daysWithSlots[dayKey] = {
          date: dayKey,

          displayDate: format(
            blockStart,
            "EEEE, MMMM d"
          ),

          slots: [],
        };
      }

      let current =
        new Date(blockStart);

      while (true) {
        const slotEnd =
          addMinutes(
            current,
            durationMinutes
          );

        if (slotEnd > blockEnd)
          break;

        if (
          !isBefore(now, current)
        ) {
          current = addMinutes(
            current,
            durationMinutes
          );

          continue;
        }

        const isBooked =
          bookedAppointments.some(
            ({
              startTime: aS,
              endTime: aE,
            }) => {
              return (
                current <
                  new Date(aE) &&
                slotEnd >
                  new Date(aS)
              );
            }
          );

        if (!isBooked) {
          daysWithSlots[
            dayKey
          ].slots.push({
            startTime:
              current.toISOString(),

            endTime:
              slotEnd.toISOString(),

            formatted: `${format(
              current,
              "h:mm a"
            )} - ${format(
              slotEnd,
              "h:mm a"
            )}`,

            day: format(
              current,
              "EEEE, MMMM d"
            ),

            duration:
              durationMinutes,
          });
        }

        current = addMinutes(
          current,
          durationMinutes
        );
      }
    }

    if (
      Object.keys(daysWithSlots)
        .length === 0
    ) {
      return { days: [] };
    }

    const sortedDays =
      Object.values(
        daysWithSlots
      ).sort(
        (a, b) =>
          new Date(a.date) -
          new Date(b.date)
      );

    return {
      days: sortedDays,
    };
  } catch (error) {
    throw new Error(
      "فشل جلب المواعيد: " +
        error.message
    );
  }
}

// ============================================================
// generateVideoToken
// ============================================================
export async function generateVideoToken(
  formData
) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error(
      "Unauthorized"
    );
  }

  try {
    const user =
      await db.user.findUnique({
        where: {
          clerkUserId: userId,
        },
      });

    if (!user) {
      throw new Error(
        "User not found"
      );
    }

    const appointmentId =
      formData.get(
        "appointmentId"
      );

    const appointment =
      await db.appointment.findUnique(
        {
          where: {
            id: appointmentId,
          },
        }
      );

    if (!appointment) {
      throw new Error(
        "Appointment not found"
      );
    }

    if (
      appointment.doctorId !==
        user.id &&
      appointment.patientId !==
        user.id
    ) {
      throw new Error(
        "غير مصرح لك"
      );
    }

    if (
      appointment.status !==
        "SCHEDULED" &&
      appointment.status !==
        "ONGOING"
    ) {
      throw new Error(
        "الموعد غير متاح حالياً"
      );
    }

    let videoSessionId =
      appointment.videoSessionId;

    if (!videoSessionId) {
      videoSessionId = `${appointment.doctorId}-${Date.now()}`;

      await db.appointment.update({
        where: {
          id: appointmentId,
        },

        data: {
          videoSessionId,
        },
      });
    }

    return {
      success: true,

      videoSessionId: `medic-${videoSessionId}`,

      token: "jitsi",
    };
  } catch (error) {
    throw new Error(
      "فشل توليد الرابط: " +
        error.message
    );
  }
}

// ============================================================
// getDoctorById
// ============================================================
export async function getDoctorById(
  doctorId
) {
  try {
    if (
      !doctorId ||
      typeof doctorId !== "string"
    ) {
      throw new Error(
        "Doctor ID غير صالح"
      );
    }

    const cleanId =
      decodeURIComponent(
        doctorId
      ).trim();

    const doctor =
      await db.user.findFirst({
        where: {
          id: cleanId,

          role: "DOCTOR",

          verificationStatus:
            "VERIFIED",
        },
      });

    if (!doctor) {
      throw new Error(
        "الطبيب غير موجود"
      );
    }

    return {
      success: true,
      doctor,
    };
  } catch (error) {
    console.error(
      "GET DOCTOR ERROR:",
      error
    );

    throw new Error(
      error.message ||
        "فشل جلب بيانات الطبيب"
    );
  }
}