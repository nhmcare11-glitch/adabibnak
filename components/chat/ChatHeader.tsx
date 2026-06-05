"use client";

import { useState } from "react";
import { Video, MoreVertical, ArrowLeft, Stethoscope, Phone, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface ChatHeaderProps {
  otherPerson?: {
    name?: string;
    imageUrl?: string;
    specialty?: string;
  };
  isOnline?: boolean;
  lastSeen?: string;
  onBack?: () => void;
  showBackButton?: boolean;
  currentUserRole?: string;
  conversationId?: string;
  onStartVideoCall?: () => void;
}

export default function ChatHeader({
  otherPerson,
  isOnline = true,
  lastSeen,
  onBack,
  showBackButton = false,
  currentUserRole,
  conversationId,
  onStartVideoCall,
}: ChatHeaderProps) {
  const [videoRequested, setVideoRequested] = useState(false);
  const isPatient = currentUserRole === "PATIENT";
  const isDoctor = currentUserRole === "DOCTOR";

  const handleVideoRequest = async () => {
    if (isPatient) {
      // المريض يرسل طلب اتصال فيديو → إشعار للطبيب
      try {
        await fetch("/api/notifications/video-request", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ conversationId }),
        });
        setVideoRequested(true);
        toast.success("تم إرسال طلب مكالمة الفيديو للطبيب");
        setTimeout(() => setVideoRequested(false), 10000);
      } catch {
        toast.error("فشل إرسال الطلب");
      }
    } else if (isDoctor) {
      // الطبيب يبدأ مكالمة مباشرة
      onStartVideoCall?.();
    }
  };

  const handlePhoneCall = async () => {
    if (!isDoctor) return;
    // الطبيب فقط يبدأ مكالمة هاتفية → إشعار للمريض
    try {
      await fetch("/api/notifications/phone-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ conversationId }),
      });
      toast.success("تم إرسال إشعار المكالمة للمريض");
    } catch {
      toast.error("فشل إرسال الإشعار");
    }
  };

  return (
    <div className="bg-white border-b border-[#e0eeee] px-4 py-2.5 flex items-center justify-between sticky top-0 z-20 flex-shrink-0">
      <div className="flex items-center gap-3">
        {showBackButton && (
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg hover:bg-[#f0fafa] transition-colors lg:hidden"
          >
            <ArrowLeft size={18} className="text-[#0d7377]" />
          </button>
        )}

        {/* Avatar */}
        <div className="relative flex-shrink-0">
          {otherPerson?.imageUrl ? (
            <img
              src={otherPerson.imageUrl}
              alt={otherPerson.name}
              className="w-9 h-9 rounded-full object-cover border border-[#c5e5e5]"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#1a9e97] to-[#0d7377] flex items-center justify-center text-white font-bold text-sm">
              {otherPerson?.name?.charAt(0)?.toUpperCase() || "?"}
            </div>
          )}
          <div
            className={`absolute -bottom-0.5 -left-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${
              isOnline ? "bg-emerald-500" : "bg-gray-400"
            }`}
          />
        </div>

        {/* Info */}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-[13px] font-semibold text-[#0d3d3d] truncate">
              {otherPerson?.name || "مجهول"}
            </h3>
            {otherPerson?.specialty && (
              <span className="text-[10px] text-[#0d7377] bg-[#e6fafa] px-2 py-0.5 rounded-full border border-[#b2e5e5] flex items-center gap-1 whitespace-nowrap">
                <Stethoscope size={9} />
                {otherPerson.specialty}
              </span>
            )}
          </div>
          <p className="text-[11px] text-emerald-500 flex items-center gap-1 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
            {isOnline ? "متصل الآن" : lastSeen || "غير متصل"}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-0.5">

        {/* زر الهاتف — للطبيب فقط */}
        {isDoctor && (
          <button
            onClick={handlePhoneCall}
            aria-label="مكالمة هاتفية"
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#f0fafa] transition-colors text-[#6b9e9e] hover:text-[#0d7377]"
          >
            <Phone size={17} />
          </button>
        )}

        {/* زر الفيديو — للجميع لكن بسلوك مختلف */}
        <button
          onClick={handleVideoRequest}
          aria-label={isPatient ? "طلب مكالمة فيديو" : "بدء مكالمة فيديو"}
          title={isPatient ? (videoRequested ? "تم إرسال الطلب" : "طلب مكالمة فيديو") : "بدء مكالمة فيديو"}
          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
            videoRequested
              ? "bg-emerald-50 text-emerald-500"
              : "hover:bg-[#f0fafa] text-[#6b9e9e] hover:text-[#0d7377]"
          }`}
        >
          {videoRequested ? <CheckCircle size={17} /> : <Video size={17} />}
        </button>

        <button
          aria-label="المزيد"
          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#f0fafa] transition-colors text-[#6b9e9e] hover:text-[#0d7377]"
        >
          <MoreVertical size={17} />
        </button>
      </div>
    </div>
  );
}