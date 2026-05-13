"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

import {
  Calendar,
  Clock,
  Stethoscope,
  FileText,
  Pill,
  ChevronRight,
  CheckCircle,
  CalendarClock,
  Activity,
  Plus,
  Bell,
  LayoutDashboard,
  MessageSquare,
  Settings,
  LogOut,
  Menu,
  X,
  User,
  Camera,
  Edit3,
  Phone,
  Mail,
  MapPin,
  Save,
  Video,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { PrescriptionView } from "@/components/prescription-view";

import PaymentProfileForm from "./PaymentProfileForm";
import PatientPaymentCard from "./PatientPaymentCard";

import InteractiveBodySection from "./InteractiveBodySection";

import { generateVideoToken } from "@/actions/appointments";

const C = {
  primary: "#0d9488",
  primaryDark: "#0f766e",
  primaryLight: "#f0fdfb",
  grad: "linear-gradient(135deg,#0d9488,#0891b2)",
  border: "#ccfbf1",
  borderMid: "#99f6e4",
  text: "#134e4a",
  textMid: "#2d7a72",
  textLight: "#5eaaa4",
  sidebar: "#0a2422",
  sidebarHov: "#112e2b",
};

const statusLabel = (s) =>
  s === "SCHEDULED"
    ? "مجدول"
    : s === "COMPLETED"
    ? "مكتمل"
    : s === "ONGOING"
    ? "جارية"
    : "ملغى";

const statusConfig = (s) => {
  if (s === "SCHEDULED") {
    return {
      bg: "bg-amber-50",
      border: "border-amber-200",
      text: "text-amber-700",
      dot: "bg-amber-400",
    };
  }

  if (s === "COMPLETED") {
    return {
      bg: "bg-teal-50",
      border: "border-teal-200",
      text: "text-teal-700",
      dot: "bg-teal-500",
    };
  }

  if (s === "ONGOING") {
    return {
      bg: "bg-blue-50",
      border: "border-blue-200",
      text: "text-blue-700",
      dot: "bg-blue-500",
    };
  }

  return {
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-600",
    dot: "bg-red-400",
  };
};

const fmtDate = (d) => {
  try {
    return format(new Date(d), "dd MMM yyyy", {
      locale: ar,
    });
  } catch {
    return "—";
  }
};

const fmtTime = (d) => {
  try {
    return format(new Date(d), "hh:mm a");
  } catch {
    return "—";
  }
};

// ======================================================
// VIDEO BUTTON
// ======================================================
function VideoCallButton({ appointmentId }) {
  const [loading, setLoading] = useState(false);

  async function handleJoin() {
    try {
      setLoading(true);

      const formData = new FormData();

      formData.append(
        "appointmentId",
        appointmentId
      );

      const result =
        await generateVideoToken(formData);

      if (!result?.videoSessionId) {
        alert("فشل إنشاء المكالمة");
        return;
      }

      window.open(
        `/video-call?appointmentId=${appointmentId}`,
        "_blank"
      );
    } catch (error) {
      console.error(error);

      alert("حدث خطأ أثناء فتح المكالمة");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleJoin}
      disabled={loading}
      className="h-8 text-xs px-3 rounded-xl font-medium transition-all flex items-center gap-1.5 text-white"
      style={{
        background: loading
          ? "#5eaaa4"
          : "linear-gradient(135deg,#0d9488,#0891b2)",
      }}
    >
      <Video className="h-3.5 w-3.5" />

      {loading
        ? "جاري..."
        : "Join Video Call"}
    </button>
  );
}

// ======================================================
// APPOINTMENT ROW
// ======================================================
function AppointmentRow({
  appt,
  onViewPrescription,
}) {
  const sc = statusConfig(appt.status);

  return (
    <div className="space-y-2">
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white transition-all duration-200"
        style={{
          border: "1px solid #ccfbf1",
        }}
      >
        {/* Doctor */}
        <div className="flex items-center gap-3 min-w-0">
          <Avatar
            className="h-11 w-11 shrink-0 border-2"
            style={{
              borderColor: "#99f6e4",
            }}
          >
            <AvatarImage
              src={appt.doctor?.imageUrl}
            />

            <AvatarFallback
              className="font-bold text-sm"
              style={{
                background: C.primaryLight,
                color: C.primary,
              }}
            >
              {appt.doctor?.name?.[0] ?? "د"}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0">
            <p
              className="font-semibold text-sm"
              style={{
                color: C.text,
              }}
            >
              Dr. {appt.doctor?.name}
            </p>

            <p
              className="text-xs mt-0.5"
              style={{
                color: C.textLight,
              }}
            >
              {appt.doctor?.specialty}
            </p>
          </div>
        </div>

        {/* Date */}
        <div
          className="flex flex-wrap items-center gap-2 text-xs"
          style={{
            color: C.textLight,
          }}
        >
          <span className="flex items-center gap-1">
            <Calendar
              className="h-3.5 w-3.5"
              style={{
                color: C.primary,
              }}
            />

            {fmtDate(appt.startTime)}
          </span>

          <span
            style={{
              color: "#99f6e4",
            }}
          >
            ·
          </span>

          <span className="flex items-center gap-1">
            <Clock
              className="h-3.5 w-3.5"
              style={{
                color: C.primary,
              }}
            />

            {fmtTime(appt.startTime)}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border ${sc.bg} ${sc.border} ${sc.text}`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${sc.dot}`}
            />

            {statusLabel(appt.status)}
          </span>

          {(appt.status === "SCHEDULED" ||
            appt.status === "ONGOING") && (
            <VideoCallButton
              appointmentId={appt.id}
            />
          )}

          {appt.prescription && (
            <button
              onClick={() =>
                onViewPrescription(
                  appt.prescription
                )
              }
              className="h-8 text-xs px-3 rounded-xl border font-medium transition-colors flex items-center gap-1.5"
              style={{
                borderColor: "#99f6e4",
                color: C.primary,
                background: C.primaryLight,
              }}
            >
              <Pill className="h-3.5 w-3.5" />

              وصفة
            </button>
          )}
        </div>
      </div>

      <PatientPaymentCard
        payment={appt.payment}
        appointment={appt}
      />
    </div>
  );
}

// ======================================================
// MAIN COMPONENT
// ======================================================
export function PatientDashboardClient({
  data,
}) {
  const {
    user,
    upcoming = [],
    past = [],
  } = data || {};

  const [
    selectedPrescription,
    setSelectedPrescription,
  ] = useState(null);

  return (
    <div
      className="min-h-screen p-6"
      dir="rtl"
      style={{
        background: C.primaryLight,
      }}
    >
      <div className="space-y-6">

        {/* Header */}
        <div>
          <h1
            className="text-3xl font-bold"
            style={{
              color: C.text,
            }}
          >
            لوحة المريض
          </h1>

          <p
            className="mt-1 text-sm"
            style={{
              color: C.textLight,
            }}
          >
            مرحباً {user?.name || "بك"}
          </p>
        </div>

        {/* Upcoming */}
        <div className="space-y-4">
          <h2
            className="text-xl font-semibold"
            style={{
              color: C.text,
            }}
          >
            المواعيد القادمة
          </h2>

          {upcoming.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 border border-teal-100 text-center">
              لا توجد مواعيد قادمة
            </div>
          ) : (
            upcoming.map((appt) => (
              <AppointmentRow
                key={appt.id}
                appt={appt}
                onViewPrescription={
                  setSelectedPrescription
                }
              />
            ))
          )}
        </div>

        {/* Past */}
        <div className="space-y-4">
          <h2
            className="text-xl font-semibold"
            style={{
              color: C.text,
            }}
          >
            المواعيد السابقة
          </h2>

          {past.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 border border-teal-100 text-center">
              لا توجد مواعيد سابقة
            </div>
          ) : (
            past.map((appt) => (
              <AppointmentRow
                key={appt.id}
                appt={appt}
                onViewPrescription={
                  setSelectedPrescription
                }
              />
            ))
          )}
        </div>
      </div>

      {/* Prescription Modal */}
      <Dialog
        open={!!selectedPrescription}
        onOpenChange={() =>
          setSelectedPrescription(null)
        }
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
          <DialogHeader>
            <DialogTitle
              className="flex items-center gap-2 text-base"
              style={{
                color: C.text,
              }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{
                  background: "#ede9fe",
                }}
              >
                <Pill
                  className="h-4 w-4"
                  style={{
                    color: "#7c3aed",
                  }}
                />
              </div>

              الوصفة الطبية
            </DialogTitle>
          </DialogHeader>

          <PrescriptionView
            prescription={
              selectedPrescription
            }
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}