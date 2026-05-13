"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Printer,
  Download,
  Pill,
  Calendar,
  User,
  Stethoscope,
  ClipboardList,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

// ── Helper: بناء HTML الكامل للوصفة ──────────────────────────────────────────
function buildPrescriptionHTML(prescription, medications) {
  const createdAt = format(new Date(prescription.createdAt), "dd MMMM yyyy", { locale: ar });
  const appointmentDate = prescription.appointment?.startTime
    ? format(new Date(prescription.appointment.startTime), "dd/MM/yyyy", { locale: ar })
    : "—";
  const followUp = prescription.followUpDate
    ? format(new Date(prescription.followUpDate), "EEEE dd MMMM yyyy", { locale: ar })
    : null;
  const appointmentRef = prescription.appointmentId
    ? prescription.appointmentId.slice(-8).toUpperCase()
    : "";

  const medsRows = medications
    .map(
      (med, i) => `
      <tr style="background:${i % 2 === 0 ? "#ffffff" : "#f0f5ff"}">
        <td style="padding:8px 12px;font-weight:600;color:#1e293b">${med.name}</td>
        <td style="padding:8px 12px;color:#475569">${med.dosage || "—"}</td>
        <td style="padding:8px 12px;color:#475569">${med.frequency || "—"}</td>
        <td style="padding:8px 12px;color:#475569">${med.duration || "—"}</td>
      </tr>`
    )
    .join("");

  const medsNotes = medications
    .filter((m) => m.notes)
    .map(
      (m) =>
        `<p style="font-size:12px;color:#64748b;margin:3px 0"><strong>${m.name}:</strong> ${m.notes}</p>`
    )
    .join("");

  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>وصفة طبية - ${prescription.patient?.name ?? ""}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Cairo:wght@400;600;700&display=swap" rel="stylesheet"/>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Cairo',Arial,sans-serif;background:#fff;color:#111;direction:rtl;-webkit-print-color-adjust:exact;print-color-adjust:exact}
    .page{max-width:750px;margin:0 auto;padding:36px 40px;border:2px solid #1a3a5c;min-height:100vh}
    .header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px double #1a3a5c;padding-bottom:16px;margin-bottom:20px}
    .doctor-name{font-family:'Amiri',serif;font-size:24px;font-weight:700;color:#1a3a5c}
    .doctor-sub{font-size:13px;color:#64748b;margin-top:4px}
    .meta{font-size:11px;color:#64748b;text-align:left;line-height:1.8}
    .meta strong{color:#374151}
    .patient-box{display:grid;grid-template-columns:1fr 1fr;gap:12px;background:#eff6ff;border-radius:8px;padding:12px;margin-bottom:20px;font-size:13px}
    .patient-box label{font-size:11px;color:#9ca3af;display:block;margin-bottom:2px}
    .patient-box strong{color:#1e293b}
    .section-title{font-size:10px;font-weight:700;letter-spacing:2px;color:#1e40af;text-transform:uppercase;border-bottom:1px solid #dbeafe;padding-bottom:5px;margin-bottom:10px}
    .diagnosis-box{background:#fffbeb;border-right:4px solid #f59e0b;padding:10px 14px;border-radius:4px;font-size:13px;color:#1e293b;margin-bottom:20px}
    .meds-table{width:100%;border-collapse:collapse;font-size:13px;margin-bottom:6px;border-radius:8px;overflow:hidden;border:1px solid #dbeafe}
    .meds-table thead tr{background:#1e3a8a}
    .meds-table th{color:#fff;padding:8px 12px;text-align:right;font-weight:600;font-size:12px}
    .meds-notes{background:#f8fafc;padding:8px 12px;border-top:1px solid #dbeafe;border-radius:0 0 8px 8px}
    .instructions-box{background:#f0fdf4;border-right:4px solid #22c55e;padding:10px 14px;border-radius:4px;font-size:13px;color:#374151;white-space:pre-line;margin-bottom:20px}
    .followup{font-size:13px;color:#475569;display:flex;align-items:center;gap:6px;margin-bottom:24px}
    .followup strong{color:#1e293b}
    .footer{display:flex;justify-content:space-between;align-items:flex-end;border-top:1px solid #e2e8f0;padding-top:14px}
    .footer-note{font-size:11px;color:#9ca3af}
    .signature{text-align:center}
    .signature-line{border-top:1px solid #9ca3af;width:140px;padding-top:6px;font-size:11px;color:#64748b}
    .signature-name{font-size:12px;font-weight:600;color:#374151;margin-top:4px}
    .watermark{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-30deg);font-size:90px;color:rgba(26,58,92,0.04);font-family:'Amiri',serif;pointer-events:none;white-space:nowrap;z-index:0}
    @media print{
      body{-webkit-print-color-adjust:exact;print-color-adjust:exact}
      .page{border:2px solid #1a3a5c;padding:24px 28px}
    }
  </style>
</head>
<body>
<div class="watermark">وصفة طبية</div>
<div class="page">

  <!-- Header -->
  <div class="header">
    <div>
      <div class="doctor-name">د. ${prescription.doctor?.name ?? ""}</div>
      <div class="doctor-sub">${prescription.doctor?.specialty ?? ""}</div>
      <div class="doctor-sub" style="font-size:11px;color:#9ca3af;margin-top:2px">منصة المواعيد الطبية</div>
    </div>
    <div class="meta">
      <div>تاريخ الوصفة: <strong>${createdAt}</strong></div>
      ${appointmentRef ? `<div>رقم الموعد: <strong style="font-family:monospace;font-size:10px">${appointmentRef}</strong></div>` : ""}
    </div>
  </div>

  <!-- Patient Info -->
  <div class="patient-box">
    <div>
      <label>المريض</label>
      <strong>${prescription.patient?.name ?? "—"}</strong>
    </div>
    <div>
      <label>تاريخ الاستشارة</label>
      <strong>${appointmentDate}</strong>
    </div>
  </div>

  ${
    prescription.diagnosis
      ? `<div style="margin-bottom:20px">
           <div class="section-title">&#x2695; التشخيص</div>
           <div class="diagnosis-box">${prescription.diagnosis}</div>
         </div>`
      : ""
  }

  ${
    medications.length > 0
      ? `<div style="margin-bottom:20px">
           <div class="section-title">&#x2665; الأدوية الموصوفة</div>
           <table class="meds-table">
             <thead>
               <tr>
                 <th>الدواء</th><th>الجرعة</th><th>التكرار</th><th>المدة</th>
               </tr>
             </thead>
             <tbody>${medsRows}</tbody>
           </table>
           ${medsNotes ? `<div class="meds-notes">${medsNotes}</div>` : ""}
         </div>`
      : ""
  }

  ${
    prescription.instructions
      ? `<div style="margin-bottom:20px">
           <div class="section-title">&#x1F4CB; تعليمات وإرشادات</div>
           <div class="instructions-box">${prescription.instructions}</div>
         </div>`
      : ""
  }

  ${
    followUp
      ? `<div class="followup">
           &#x1F4C5; موعد المتابعة القادم: <strong>${followUp}</strong>
         </div>`
      : ""
  }

  <div class="footer">
    <div class="footer-note">هذه الوصفة صادرة إلكترونياً عبر منصة المواعيد الطبية</div>
    <div class="signature">
      <div class="signature-line">توقيع الطبيب</div>
      <div class="signature-name">د. ${prescription.doctor?.name ?? ""}</div>
    </div>
  </div>

</div>
</body>
</html>`;
}

export function PrescriptionView({ prescription, showActions = true }) {
  const printRef = useRef(null);
  const [downloading, setDownloading] = useState(false);

  if (!prescription) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-3" />
        <p className="text-muted-foreground">لا توجد وصفة طبية لهذا الموعد بعد</p>
      </div>
    );
  }

  const medications = Array.isArray(prescription.medications)
    ? prescription.medications
    : [];

  // ── الطباعة ───────────────────────────────────────────────────────────────
  const handlePrint = () => {
    const html = buildPrescriptionHTML(prescription, medications);
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    // ننتظر تحميل الخطوط قبل الطباعة
    setTimeout(() => {
      win.print();
      win.close();
    }, 800);
  };

  // ── تحميل PDF (بدون مكتبات خارجية) ──────────────────────────────────────
  // نستخدم print dialog مع CSS @page لتوليد PDF نظيف
  // المستخدم يختار "حفظ كـ PDF" في نافذة الطباعة
  const handleDownload = () => {
    setDownloading(true);

    const html = buildPrescriptionHTML(prescription, medications);

    // نضيف CSS إضافي يجعل المتصفح يعرض "حفظ كـ PDF" مباشرة
    const pdfHTML = html.replace(
      "</style>",
      `
      @page {
        size: A4;
        margin: 0;
      }
      body {
        margin: 0;
      }
      .page {
        border: none !important;
        min-height: auto;
        max-width: 100%;
        padding: 20mm 15mm;
      }
      </style>`
    );

    const win = window.open("", "_blank");
    if (!win) {
      alert("يرجى السماح بالنوافذ المنبثقة لتحميل الوصفة");
      setDownloading(false);
      return;
    }

    win.document.write(pdfHTML);
    win.document.close();
    win.focus();

    setTimeout(() => {
      win.print();
      setDownloading(false);
      // لا نغلق النافذة حتى يتمكن المستخدم من الحفظ
      win.onafterprint = () => win.close();
    }, 800);
  };

  return (
    <div className="space-y-4">
      {showActions && (
        <div className="flex gap-2 justify-end print:hidden">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            disabled={downloading}
            className="border-emerald-700 text-emerald-400 hover:bg-emerald-900/30"
          >
            {downloading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                جارٍ التحميل...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                تحميل PDF
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="border-blue-700 text-blue-400 hover:bg-blue-900/30"
          >
            <Printer className="h-4 w-4 mr-2" />
            طباعة
          </Button>
        </div>
      )}

      {/* ورقة الوصفة - للعرض فقط داخل الموقع */}
      <div
        ref={printRef}
        className="rx-paper bg-white text-gray-900 rounded-lg border-2 border-blue-900/40 p-8 max-w-2xl mx-auto"
        dir="rtl"
        style={{ fontFamily: "'Cairo', sans-serif" }}
      >
        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-double border-blue-900 pb-4 mb-5">
          <div>
            <div
              className="font-bold text-blue-900 text-2xl"
              style={{ fontFamily: "'Amiri', serif" }}
            >
              د. {prescription.doctor?.name}
            </div>
            <div className="text-gray-500 text-sm mt-1">
              {prescription.doctor?.specialty}
            </div>
            <div className="text-gray-400 text-xs mt-1">منصة المواعيد الطبية</div>
          </div>
          <div className="text-left text-xs text-gray-500 space-y-1">
            <div>
              تاريخ الوصفة:{" "}
              <strong className="text-gray-700">
                {format(new Date(prescription.createdAt), "dd MMMM yyyy", { locale: ar })}
              </strong>
            </div>
            {prescription.appointmentId && (
              <div>
                رقم الموعد:{" "}
                <strong className="text-gray-700 font-mono text-[10px]">
                  {prescription.appointmentId.slice(-8).toUpperCase()}
                </strong>
              </div>
            )}
          </div>
        </div>

        {/* بيانات المريض */}
        <div className="grid grid-cols-2 gap-3 bg-blue-50 rounded-lg p-3 mb-5 text-sm">
          <div>
            <label className="text-xs text-gray-400 block">المريض</label>
            <strong className="text-gray-800 flex items-center gap-1">
              <User className="h-3 w-3 text-blue-600" />
              {prescription.patient?.name}
            </strong>
          </div>
          <div>
            <label className="text-xs text-gray-400 block">تاريخ الاستشارة</label>
            <strong className="text-gray-800 flex items-center gap-1">
              <Calendar className="h-3 w-3 text-blue-600" />
              {prescription.appointment?.startTime
                ? format(
                    new Date(prescription.appointment.startTime),
                    "dd/MM/yyyy",
                    { locale: ar }
                  )
                : "—"}
            </strong>
          </div>
        </div>

        {/* التشخيص */}
        {prescription.diagnosis && (
          <div className="mb-5">
            <div className="text-[10px] font-bold tracking-widest text-blue-800 uppercase border-b border-blue-100 pb-1 mb-2 flex items-center gap-1">
              <Stethoscope className="h-3 w-3" /> التشخيص
            </div>
            <div className="bg-amber-50 border-r-4 border-amber-400 px-4 py-2 rounded text-sm text-gray-800">
              {prescription.diagnosis}
            </div>
          </div>
        )}

        {/* الأدوية */}
        {medications.length > 0 && (
          <div className="mb-5">
            <div className="text-[10px] font-bold tracking-widest text-blue-800 uppercase border-b border-blue-100 pb-1 mb-2 flex items-center gap-1">
              <Pill className="h-3 w-3" /> الأدوية الموصوفة
            </div>
            <div className="overflow-hidden rounded-lg border border-blue-100">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-blue-800 text-white">
                    <th className="text-right px-3 py-2 font-semibold">الدواء</th>
                    <th className="text-right px-3 py-2 font-semibold">الجرعة</th>
                    <th className="text-right px-3 py-2 font-semibold">التكرار</th>
                    <th className="text-right px-3 py-2 font-semibold">المدة</th>
                  </tr>
                </thead>
                <tbody>
                  {medications.map((med, i) => (
                    <tr
                      key={i}
                      className={i % 2 === 0 ? "bg-white" : "bg-blue-50/40"}
                    >
                      <td className="px-3 py-2 font-medium text-gray-800">
                        {med.name}
                      </td>
                      <td className="px-3 py-2 text-gray-600">{med.dosage}</td>
                      <td className="px-3 py-2 text-gray-600">{med.frequency}</td>
                      <td className="px-3 py-2 text-gray-600">{med.duration}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {medications.some((m) => m.notes) && (
                <div className="bg-gray-50 px-3 py-2 border-t border-blue-100">
                  {medications
                    .filter((m) => m.notes)
                    .map((m, i) => (
                      <p key={i} className="text-xs text-gray-500">
                        <span className="font-semibold">{m.name}:</span> {m.notes}
                      </p>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* تعليمات */}
        {prescription.instructions && (
          <div className="mb-5">
            <div className="text-[10px] font-bold tracking-widest text-blue-800 uppercase border-b border-blue-100 pb-1 mb-2 flex items-center gap-1">
              <ClipboardList className="h-3 w-3" /> تعليمات وإرشادات
            </div>
            <div className="bg-green-50 border-r-4 border-green-400 px-4 py-2 rounded text-sm text-gray-700 whitespace-pre-line">
              {prescription.instructions}
            </div>
          </div>
        )}

        {/* موعد المتابعة */}
        {prescription.followUpDate && (
          <div className="mb-6 text-sm text-gray-600 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-blue-600" />
            موعد المتابعة القادم:{" "}
            <strong className="text-gray-800">
              {format(
                new Date(prescription.followUpDate),
                "EEEE dd MMMM yyyy",
                { locale: ar }
              )}
            </strong>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-between items-end border-t border-gray-200 pt-4 mt-2">
          <div className="text-xs text-gray-400">
            هذه الوصفة صادرة إلكترونياً عبر منصة المواعيد الطبية
          </div>
          <div className="text-center">
            <div className="border-t border-gray-400 w-36 pt-2 text-xs text-gray-500">
              توقيع الطبيب
            </div>
            <div className="text-xs font-medium text-gray-700 mt-1">
              د. {prescription.doctor?.name}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}