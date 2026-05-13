"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

const METHOD_LABELS = {
  CASH:     "💵 نقدي",
  CARD:     "💳 بطاقة",
  FREE:     "🆓 مجاني",
  DEFERRED: "⏳ مؤجل",
};

const STATUS_COLORS = {
  PENDING_APPROVAL: "bg-yellow-100 text-yellow-800",
  APPROVED:         "bg-green-100 text-green-800",
  REJECTED:         "bg-red-100 text-red-800",
  PAID:             "bg-blue-100 text-blue-800",
};

const STATUS_LABELS = {
  PENDING_APPROVAL: "انتظار موافقة",
  APPROVED:         "موافق عليه",
  REJECTED:         "مرفوض",
  PAID:             "تم الدفع",
};

export default function SecretaryPaymentsList({ appointments }) {
  const [filter, setFilter] = useState("ALL");

  // فلتر المواعيد اللي عندها دفع
  const withPayment = appointments.filter(a => a.payment);

  const filtered = filter === "ALL"
    ? withPayment
    : withPayment.filter(a => a.payment.status === filter);

  // إحصائيات
  const totalAmount = withPayment
    .filter(a => a.payment.status === "APPROVED" && a.payment.amount)
    .reduce((sum, a) => sum + (a.payment.amount || 0), 0);

  const pendingCount = withPayment.filter(a => a.payment.status === "PENDING_APPROVAL").length;
  const approvedCount = withPayment.filter(a => a.payment.status === "APPROVED").length;
  const freeCount = withPayment.filter(a => a.payment.approvedMethod === "FREE").length;

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">
        المدفوعات ({withPayment.length})
      </h2>

      {/* إحصائيات */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "إجمالي المبالغ", value: `${totalAmount.toFixed(0)} دج`, color: "text-blue-600" },
          { label: "انتظار موافقة", value: pendingCount, color: "text-yellow-600" },
          { label: "تمت الموافقة", value: approvedCount, color: "text-green-600" },
          { label: "معفى من الدفع", value: freeCount, color: "text-purple-600" },
        ].map((stat, i) => (
          <Card key={i}>
            <CardContent className="p-3 text-center">
              <div className={`text-xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* فلاتر */}
      <div className="flex gap-2 flex-wrap mb-4">
        {[
          { key: "ALL", label: "الكل" },
          { key: "PENDING_APPROVAL", label: "انتظار" },
          { key: "APPROVED", label: "موافق" },
          { key: "REJECTED", label: "مرفوض" },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${
              filter === f.key
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-transparent text-muted-foreground border-border hover:bg-muted"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* القائمة */}
      {filtered.length === 0 ? (
        <p className="text-muted-foreground text-center py-10">لا توجد مدفوعات</p>
      ) : (
        <div className="space-y-3">
          {filtered.map(apt => {
            const p = apt.payment;
            return (
              <Card key={apt.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between flex-wrap gap-3">
                    <div>
                      <p className="font-medium text-sm">
                        👤 {apt.patient?.name}
                        <span className="text-muted-foreground font-normal"> — د. {apt.doctor?.name}</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(apt.startTime), "dd MMM yyyy — HH:mm", { locale: ar })}
                      </p>

                      {/* طريقة الدفع */}
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className="text-xs text-muted-foreground">الاقتراح:</span>
                        <span className="text-xs font-medium">{METHOD_LABELS[p.suggestedMethod]}</span>
                        {p.approvedMethod && p.approvedMethod !== p.suggestedMethod && (
                          <>
                            <span className="text-xs text-muted-foreground">← الموافقة:</span>
                            <span className="text-xs font-medium text-green-600">{METHOD_LABELS[p.approvedMethod]}</span>
                          </>
                        )}
                        {p.amount && (
                          <span className="text-xs font-bold text-blue-600">{p.amount} دج</span>
                        )}
                      </div>
                    </div>

                    <Badge className={STATUS_COLORS[p.status]}>
                      {STATUS_LABELS[p.status]}
                    </Badge>
                  </div>

                  {/* ملاحظات الرفض */}
                  {p.status === "REJECTED" && p.notes && (
                    <p className="text-xs text-red-500 mt-2">❌ {p.notes}</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}