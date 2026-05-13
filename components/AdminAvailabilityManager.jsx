"use client";

import { useState } from "react";
import {
  Clock,
  Plus,
  Trash2,
  Loader2,
  ChevronDown,
  ChevronUp,
  Shield,
  CheckCircle,
  Ban,
  Stethoscope,
} from "lucide-react";
import {
  setDoctorAvailabilityByAdmin,
  deleteDoctorAvailabilitySlot,
  toggleSlotStatus,
  getAllDoctorsWithAvailability,
} from "@/actions/admin";
import { toast } from "sonner";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatTime(dateStr) {
  try {
    return new Date(dateStr).toLocaleTimeString("ar-DZ", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

function GlassCard({ children, className = "" }) {
  return (
    <div
      className={`rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md shadow-lg ${className}`}
    >
      {children}
    </div>
  );
}

function SlotBadge({ status }) {
  const map = {
    AVAILABLE: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    BOOKED: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
    BLOCKED: "bg-rose-500/20 text-rose-300 border-rose-500/30",
  };
  const labels = { AVAILABLE: "متاح", BOOKED: "محجوز", BLOCKED: "محظور" };
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-[11px] border font-medium ${map[status] ?? "bg-white/10 text-white/40 border-white/10"}`}
    >
      {labels[status] ?? status}
    </span>
  );
}

// ─── Form to add/replace availability for one doctor ─────────────────────────
function AvailabilityForm({ doctorId, onSuccess }) {
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!startTime || !endTime) {
      toast.error("يرجى تحديد وقت البدء والانتهاء");
      return;
    }

    // بناء datetime من وقت اليوم
    const today = new Date();
    const build = (t) => {
      const [h, m] = t.split(":").map(Number);
      return new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        h,
        m
      ).toISOString();
    };

    const start = build(startTime);
    const end = build(endTime);

    if (new Date(start) >= new Date(end)) {
      toast.error("وقت البدء يجب أن يكون قبل وقت الانتهاء");
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("doctorId", doctorId);
      fd.append("startTime", start);
      fd.append("endTime", end);
      const result = await setDoctorAvailabilityByAdmin(fd);
      if (result.success) {
        toast.success("تم تحديث جدول التوافر بنجاح");
        setStartTime("");
        setEndTime("");
        onSuccess?.();
      }
    } catch (err) {
      toast.error(err.message || "فشل حفظ الجدول");
    }
    setLoading(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-3 p-4 rounded-xl bg-white/5 border border-white/10 space-y-3"
    >
      <p className="text-white/60 text-xs font-medium">
        تحديد وقت عمل الطبيب (يومياً)
      </p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-white/40 text-[11px] block mb-1">
            وقت البدء
          </label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            required
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-violet-500/50 [color-scheme:dark]"
          />
        </div>
        <div>
          <label className="text-white/40 text-[11px] block mb-1">
            وقت الانتهاء
          </label>
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            required
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-violet-500/50 [color-scheme:dark]"
          />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-xs bg-violet-600/30 border border-violet-500/40 text-violet-300 rounded-xl hover:bg-violet-600/50 transition-all disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Plus className="w-3 h-3" />
          )}
          {loading ? "جاري الحفظ..." : "حفظ الجدول"}
        </button>
      </div>
    </form>
  );
}

// ─── Single Doctor Card ───────────────────────────────────────────────────────
function DoctorAvailabilityCard({ doctor, onRefresh }) {
  const [expanded, setExpanded] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  const slots = doctor.availabilities ?? [];

  const handleDelete = async (slotId) => {
    if (!confirm("هل تريد حذف هذا الوقت؟")) return;
    setActionLoading(slotId);
    try {
      const fd = new FormData();
      fd.append("slotId", slotId);
      await deleteDoctorAvailabilitySlot(fd);
      toast.success("تم حذف الوقت");
      onRefresh?.();
    } catch (err) {
      toast.error(err.message || "فشل الحذف");
    }
    setActionLoading(null);
  };

  const handleToggle = async (slotId) => {
    setActionLoading(slotId);
    try {
      const fd = new FormData();
      fd.append("slotId", slotId);
      const result = await toggleSlotStatus(fd);
      toast.success(
        result.newStatus === "BLOCKED" ? "تم حظر الوقت" : "تم تفعيل الوقت"
      );
      onRefresh?.();
    } catch (err) {
      toast.error(err.message || "فشلت العملية");
    }
    setActionLoading(null);
  };

  return (
    <GlassCard className="overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-4 hover:bg-white/3 transition-colors text-left"
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600/40 to-cyan-600/40 border border-white/10 flex items-center justify-center text-white font-bold shrink-0">
          {doctor.name?.[0] ?? "د"}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-medium text-sm truncate">
            {doctor.name ?? "بدون اسم"}
          </p>
          <p className="text-white/40 text-xs">{doctor.specialty ?? "—"}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-white/40 text-xs">
            {slots.length === 0
              ? "لا يوجد جدول"
              : `${slots.length} وقت محدد`}
          </span>
          {slots.length > 0 && (
            <span className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[10px] px-2 py-0.5 rounded-full">
              {formatTime(slots[0].startTime)} →{" "}
              {formatTime(slots[slots.length - 1].endTime)}
            </span>
          )}
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-white/30" />
          ) : (
            <ChevronDown className="w-4 h-4 text-white/30" />
          )}
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-3">
          {/* Slots list */}
          {slots.length === 0 ? (
            <p className="text-white/30 text-xs text-center py-4">
              لم يتم تحديد أوقات عمل لهذا الطبيب
            </p>
          ) : (
            <div className="space-y-2">
              {slots.map((slot) => (
                <div
                  key={slot.id}
                  className="flex items-center justify-between bg-white/3 border border-white/5 rounded-xl px-3 py-2.5"
                >
                  <div className="flex items-center gap-3">
                    <Clock className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                    <div>
                      <p className="text-white text-xs font-medium">
                        {formatTime(slot.startTime)} — {formatTime(slot.endTime)}
                      </p>
                      <p className="text-white/30 text-[10px]">
                        ينطبق على جميع الأيام
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <SlotBadge status={slot.status} />
                    {slot.status !== "BOOKED" && (
                      <>
                        <button
                          onClick={() => handleToggle(slot.id)}
                          disabled={actionLoading === slot.id}
                          title={
                            slot.status === "AVAILABLE" ? "حظر الوقت" : "تفعيل الوقت"
                          }
                          className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-white/40 hover:text-white hover:border-white/20 transition-all disabled:opacity-50"
                        >
                          {actionLoading === slot.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : slot.status === "AVAILABLE" ? (
                            <Ban className="w-3 h-3" />
                          ) : (
                            <CheckCircle className="w-3 h-3" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(slot.id)}
                          disabled={actionLoading === slot.id}
                          title="حذف"
                          className="w-7 h-7 flex items-center justify-center rounded-lg bg-rose-600/10 border border-rose-500/20 text-rose-400 hover:bg-rose-600/20 transition-all disabled:opacity-50"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add/Replace form */}
          {showForm ? (
            <AvailabilityForm
              doctorId={doctor.id}
              onSuccess={() => {
                setShowForm(false);
                onRefresh?.();
              }}
            />
          ) : (
            <button
              onClick={() => setShowForm(true)}
              className="w-full flex items-center justify-center gap-2 py-2 text-xs border border-dashed border-violet-500/30 text-violet-400 rounded-xl hover:bg-violet-600/10 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              {slots.length > 0 ? "تعديل وقت العمل" : "تحديد وقت العمل"}
            </button>
          )}
        </div>
      )}
    </GlassCard>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function AdminAvailabilityManager({ initialDoctors = [] }) {
  const [doctors, setDoctors] = useState(initialDoctors);
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const filtered = doctors.filter(
    (d) =>
      d.name?.includes(search) ||
      d.specialty?.includes(search) ||
      d.email?.includes(search)
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const result = await getAllDoctorsWithAvailability();
      if (result.doctors) setDoctors(result.doctors);
    } catch (err) {
      toast.error("فشل تحديث البيانات");
    }
    setRefreshing(false);
  };

  const withSlots = doctors.filter((d) => d.availabilities?.length > 0).length;
  const withoutSlots = doctors.length - withSlots;

  return (
    <div className="space-y-5" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-white text-lg font-semibold flex items-center gap-2">
            <Shield className="w-5 h-5 text-violet-400" />
            إدارة جداول الأطباء
          </h2>
          <p className="text-white/40 text-xs mt-0.5">
            الأدمين فقط يستطيع تحديد أوقات عمل الأطباء
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 text-xs bg-white/5 border border-white/10 text-white/60 px-3 py-2 rounded-xl hover:bg-white/10 transition-all disabled:opacity-50"
        >
          {refreshing ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Stethoscope className="w-3.5 h-3.5" />
          )}
          تحديث
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "إجمالي الأطباء", val: doctors.length, color: "text-white" },
          { label: "لديهم جدول", val: withSlots, color: "text-emerald-400" },
          { label: "بدون جدول", val: withoutSlots, color: "text-amber-400" },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl bg-white/5 border border-white/10 p-3 text-center"
          >
            <p className={`text-xl font-bold ${s.color}`}>{s.val}</p>
            <p className="text-white/40 text-[10px] mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ابحث عن طبيب بالاسم أو التخصص..."
          className="flex-1 bg-transparent text-white/80 text-sm outline-none placeholder:text-white/30"
        />
      </div>

      {/* Doctors list */}
      {filtered.length === 0 ? (
        <div className="text-center py-10 text-white/30 text-sm">
          لا يوجد أطباء موثّقون
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((doc) => (
            <DoctorAvailabilityCard
              key={doc.id}
              doctor={doc}
              onRefresh={handleRefresh}
            />
          ))}
        </div>
      )}
    </div>
  );
}