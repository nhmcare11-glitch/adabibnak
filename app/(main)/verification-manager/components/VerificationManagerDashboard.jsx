"use client";

import { useState, useTransition } from "react";
import { CheckCircle, XCircle, Clock, Users, FileText, ExternalLink, ChevronDown, ChevronUp, Search, Shield } from "lucide-react";
import { approveDoctorVM, rejectDoctorVM } from "@/actions/verification-manager";

// ─────────────────────────────────────────────
// Stat Card
// ─────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color }) {
  const colors = {
    teal:   { bg: "bg-[#2DBFB8]/10 dark:bg-[#2DBFB8]/15", text: "text-[#2DBFB8]", border: "border-[#2DBFB8]/20" },
    green:  { bg: "bg-emerald-500/10",  text: "text-emerald-500",  border: "border-emerald-500/20" },
    red:    { bg: "bg-rose-500/10",     text: "text-rose-500",     border: "border-rose-500/20" },
    orange: { bg: "bg-amber-500/10",    text: "text-amber-500",    border: "border-amber-500/20" },
  };
  const c = colors[color] || colors.teal;

  return (
    <div className={`rounded-2xl border ${c.border} bg-white/60 dark:bg-[#0a1e1d]/80 backdrop-blur p-5 flex items-center gap-4`}>
      <div className={`w-12 h-12 rounded-xl ${c.bg} flex items-center justify-center shrink-0`}>
        <Icon className={`w-6 h-6 ${c.text}`} />
      </div>
      <div>
        <p className="text-2xl font-black text-[#062220] dark:text-white">{value}</p>
        <p className="text-sm text-[#54706d] dark:text-slate-400">{label}</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Doctor Card
// ─────────────────────────────────────────────
function DoctorCard({ doctor, onApprove, onReject, isPending, showActions = true }) {
  const [expanded, setExpanded] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);

  const statusColors = {
    PENDING:  "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    VERIFIED: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    REJECTED: "bg-rose-500/15 text-rose-500",
  };

  const statusLabels = {
    PENDING: "قيد المراجعة",
    VERIFIED: "مقبول",
    REJECTED: "مرفوض",
  };

  return (
    <div className="rounded-2xl border border-[#2DBFB8]/15 dark:border-[#2DBFB8]/20 bg-white/70 dark:bg-[#0a1e1d]/80 backdrop-blur overflow-hidden transition-all duration-300 hover:border-[#2DBFB8]/40 hover:shadow-lg hover:shadow-[#2DBFB8]/5">
      {/* Header */}
      <div className="p-5 flex items-start gap-4">
        {/* Avatar */}
        <div className="w-12 h-12 rounded-xl bg-[#2DBFB8]/15 border border-[#2DBFB8]/25 flex items-center justify-center shrink-0 text-[#2DBFB8] font-bold text-lg">
          {doctor.name?.[0] || "د"}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-[#062220] dark:text-white truncate">{doctor.name || "غير محدد"}</h3>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[doctor.verificationStatus]}`}>
              {statusLabels[doctor.verificationStatus]}
            </span>
          </div>
          <p className="text-sm text-[#54706d] dark:text-slate-400 mt-0.5">{doctor.email}</p>
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            {doctor.specialty && (
              <span className="text-xs bg-[#2DBFB8]/10 text-[#2DBFB8] px-2 py-0.5 rounded-full">{doctor.specialty}</span>
            )}
            {doctor.experience && (
              <span className="text-xs text-[#54706d] dark:text-slate-400">{doctor.experience} سنوات خبرة</span>
            )}
            <span className="text-xs text-[#54706d] dark:text-slate-500">
              {new Date(doctor.createdAt).toLocaleDateString("ar-DZ")}
            </span>
          </div>
        </div>

        <button onClick={() => setExpanded(!expanded)} className="text-[#54706d] hover:text-[#2DBFB8] transition-colors shrink-0">
          {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="px-5 pb-4 border-t border-[#2DBFB8]/10 pt-4 space-y-3">
          {doctor.description && (
            <div>
              <p className="text-xs text-[#54706d] dark:text-slate-400 mb-1">وصف الخدمات</p>
              <p className="text-sm text-[#062220] dark:text-slate-200 leading-relaxed">{doctor.description}</p>
            </div>
          )}
          {doctor.credentialUrl && (
            <a href={doctor.credentialUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-[#2DBFB8] hover:underline">
              <FileText className="w-4 h-4" />
              عرض الشهادة
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      )}

      {/* Actions */}
      {showActions && doctor.verificationStatus === "PENDING" && (
        <div className="px-5 pb-5 flex flex-col gap-2">
          {showRejectInput ? (
            <div className="space-y-2">
              <input
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="سبب الرفض (اختياري)..."
                className="w-full text-sm rounded-xl border border-rose-300/40 bg-rose-500/5 px-3 py-2 text-[#062220] dark:text-white placeholder:text-[#54706d] focus:outline-none focus:border-rose-400"
                dir="rtl"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => { onReject(doctor.id, rejectReason); setShowRejectInput(false); }}
                  disabled={isPending}
                  className="flex-1 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold transition-all disabled:opacity-50"
                >
                  تأكيد الرفض
                </button>
                <button onClick={() => setShowRejectInput(false)} className="px-4 py-2 rounded-xl border border-[#2DBFB8]/20 text-sm text-[#54706d] hover:bg-[#2DBFB8]/5 transition-all">
                  إلغاء
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => onApprove(doctor.id)}
                disabled={isPending}
                className="flex-1 py-2.5 rounded-xl bg-[#2DBFB8] hover:bg-[#1A9E99] text-white text-sm font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <CheckCircle className="w-4 h-4" /> قبول
              </button>
              <button
                onClick={() => setShowRejectInput(true)}
                disabled={isPending}
                className="flex-1 py-2.5 rounded-xl border border-rose-400/30 text-rose-500 hover:bg-rose-500/10 text-sm font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <XCircle className="w-4 h-4" /> رفض
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Dashboard
// ─────────────────────────────────────────────
export default function VerificationManagerDashboard({ stats, pendingDoctors, verifiedDoctors, rejectedDoctors }) {
  const [activeTab, setActiveTab] = useState("pending");
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();

  const tabs = [
    { key: "pending",  label: "قيد المراجعة", count: stats.pending,  color: "text-amber-500" },
    { key: "verified", label: "المقبولون",     count: stats.verified, color: "text-emerald-500" },
    { key: "rejected", label: "المرفوضون",     count: stats.rejected, color: "text-rose-500" },
  ];

  const currentDoctors =
    activeTab === "pending"  ? pendingDoctors  :
    activeTab === "verified" ? verifiedDoctors :
    rejectedDoctors;

  const filtered = currentDoctors.filter((d) =>
    !search ||
    d.name?.toLowerCase().includes(search.toLowerCase()) ||
    d.email?.toLowerCase().includes(search.toLowerCase()) ||
    d.specialty?.toLowerCase().includes(search.toLowerCase())
  );

  function handleApprove(doctorId) {
    startTransition(async () => {
      const fd = new FormData();
      fd.append("doctorId", doctorId);
      await approveDoctorVM(fd);
    });
  }

  function handleReject(doctorId, reason) {
    startTransition(async () => {
      const fd = new FormData();
      fd.append("doctorId", doctorId);
      fd.append("reason", reason || "");
      await rejectDoctorVM(fd);
    });
  }

  return (
    <div className="min-h-screen bg-[#eefdff] dark:bg-[#071312] transition-colors duration-500" dir="rtl">
      {/* Header */}
      <div className="border-b border-[#2DBFB8]/10 bg-white/60 dark:bg-[#071817]/80 backdrop-blur sticky top-0 z-30">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#2DBFB8]/15 border border-[#2DBFB8]/25 flex items-center justify-center">
            <Shield className="w-5 h-5 text-[#2DBFB8]" />
          </div>
          <div>
            <h1 className="font-black text-[#062220] dark:text-white text-lg leading-none">لوحة التحقق</h1>
            <p className="text-xs text-[#54706d] dark:text-slate-400">مراجعة وقبول الأطباء</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="إجمالي الأطباء"    value={stats.total}    icon={Users}       color="teal" />
          <StatCard label="قيد المراجعة"       value={stats.pending}  icon={Clock}       color="orange" />
          <StatCard label="مقبولون"             value={stats.verified} icon={CheckCircle} color="green" />
          <StatCard label="مرفوضون"             value={stats.rejected} icon={XCircle}     color="red" />
        </div>

        {/* Tabs + Search */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex gap-1 bg-white/60 dark:bg-[#0a1e1d]/80 border border-[#2DBFB8]/15 rounded-2xl p-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5 ${
                  activeTab === tab.key
                    ? "bg-[#2DBFB8] text-white shadow"
                    : "text-[#54706d] dark:text-slate-400 hover:text-[#062220] dark:hover:text-white"
                }`}
              >
                {tab.label}
                <span className={`text-xs ${activeTab === tab.key ? "text-white/80" : tab.color}`}>
                  ({tab.count})
                </span>
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#54706d]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث بالاسم أو التخصص..."
              className="w-64 pr-9 pl-4 py-2.5 rounded-xl border border-[#2DBFB8]/20 bg-white/60 dark:bg-[#0a1e1d]/80 text-sm text-[#062220] dark:text-white placeholder:text-[#54706d] focus:outline-none focus:border-[#2DBFB8]/50 backdrop-blur"
            />
          </div>
        </div>

        {/* Doctors Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-[#54706d] dark:text-slate-500">
            <Shield className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium">لا يوجد أطباء في هذا القسم</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((doctor) => (
              <DoctorCard
                key={doctor.id}
                doctor={doctor}
                onApprove={handleApprove}
                onReject={handleReject}
                isPending={isPending}
                showActions={activeTab === "pending"}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}