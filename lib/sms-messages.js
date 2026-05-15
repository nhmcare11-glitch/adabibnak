import { format } from "date-fns";
import { arDZ } from "date-fns/locale";

// ============================================================
// تنسيق التاريخ والوقت
// ============================================================
function formatDate(date) {
  return format(date, "yyyy/MM/dd", { locale: arDZ });
}

function formatTime(date) {
  return format(date, "HH:mm");
}

// ============================================================
// عند حجز موعد جديد — للمريض
// ============================================================
export function msgAppointmentBooked({ patientName, doctorName, startTime }) {
  return (
    `مرحباً ${patientName}،\n` +
    `✅ تم تأكيد موعدك مع د. ${doctorName}\n` +
    `📅 ${formatDate(startTime)} — ${formatTime(startTime)}\n` +
    `AdaBibnak`
  );
}

// ============================================================
// عند حجز موعد جديد — للطبيب
// ============================================================
export function msgNewAppointmentForDoctor({ doctorName, patientName, startTime }) {
  return (
    `مرحباً د. ${doctorName}،\n` +
    `📅 موعد جديد مع ${patientName}\n` +
    `🕐 ${formatDate(startTime)} — ${formatTime(startTime)}\n` +
    `AdaBibnak`
  );
}

// ============================================================
// تذكير قبل الموعد بـ 24 ساعة — للمريض
// ============================================================
export function msgAppointmentReminder({ patientName, doctorName, startTime }) {
  return (
    `تذكير — ${patientName}،\n` +
    `⏰ موعدك مع د. ${doctorName} غداً\n` +
    `🕐 ${formatDate(startTime)} — ${formatTime(startTime)}\n` +
    `AdaBibnak`
  );
}

// ============================================================
// عند إلغاء الموعد — للمريض
// ============================================================
export function msgAppointmentCancelled({ patientName, doctorName, startTime, reason }) {
  const reasonLine = reason ? `\nالسبب: ${reason}` : "";
  return (
    `${patientName}،\n` +
    `❌ تم إلغاء موعدك مع د. ${doctorName}\n` +
    `📅 ${formatDate(startTime)} — ${formatTime(startTime)}` +
    reasonLine +
    `\nAdaBibnak`
  );
}

// ============================================================
// عند كتابة وصفة / رد الطبيب — للمريض
// ============================================================
export function msgDoctorReplied({ patientName, doctorName }) {
  return (
    `${patientName}،\n` +
    `💊 د. ${doctorName} كتب لك وصفة طبية\n` +
    `افتح التطبيق لمشاهدتها.\n` +
    `AdaBibnak`
  );
}

// ============================================================
// عند تغيير وقت الموعد — للمريض
// ============================================================
export function msgAppointmentRescheduled({ patientName, doctorName, newStartTime }) {
  return (
    `${patientName}،\n` +
    `🔄 تم تغيير موعدك مع د. ${doctorName}\n` +
    `📅 الوقت الجديد: ${formatDate(newStartTime)} — ${formatTime(newStartTime)}\n` +
    `AdaBibnak`
  );
}