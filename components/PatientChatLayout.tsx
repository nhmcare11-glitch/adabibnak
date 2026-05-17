"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import {
  MessageSquare, Search, Send, Paperclip, Mic, Image, FileText,
  Check, CheckCheck, Clock, MoreVertical, Phone, Video,
  ChevronLeft, X, Loader2, Stethoscope, AlertCircle,
  User, Calendar, MapPin
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

// ── Design System - Medical Clean Theme ─────────────────────────────────
const theme = {
  // Primary - Teal Medical
  primary:       "#0d9488",
  primaryDark:   "#0f766e",
  primaryLight:  "#f0fdfa",
  primaryMid:    "#ccfbf1",

  // Text
  text:          "#134e4a",
  textSecondary: "#2d7a72",
  textMuted:     "#5eaaa4",
  textLight:     "#94a3b8",

  // Backgrounds
  bgMain:        "#f8fafc",
  bgCard:        "#ffffff",
  bgHover:       "#f0fdfa",

  // Borders
  border:        "#e2e8f0",
  borderLight:   "#f1f5f9",

  // Status
  online:        "#10b981",
  offline:       "#cbd5e1",
  unread:        "#ef4444",

  // Shadows
  shadowSm:      "0 1px 2px 0 rgb(0 0 0 / 0.05)",
  shadowMd:      "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
  shadowLg:      "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
};

// ── Types ───────────────────────────────────────────────────────────────
interface Doctor {
  id: string;
  name: string;
  imageUrl?: string;
  specialty: string;
  isOnline?: boolean;
  location?: string;
}

interface Message {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    imageUrl?: string;
  };
  files?: Array<{ name: string; type: string; url?: string; size?: number }>;
  read?: boolean;
  status?: "sending" | "sent" | "delivered" | "read";
}

interface Conversation {
  id: string;
  doctor: Doctor;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
}

// ── Mock Data - Realistic Medical Conversations ─────────────────────────
const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: "conv-1",
    doctor: {
      id: "doc-1",
      name: "د. أحمد الخالدي",
      specialty: "أمراض القلب والأوعية الدموية",
      imageUrl: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150&h=150&fit=crop&crop=face",
      isOnline: true,
      location: "عمان - الأردن",
    },
    lastMessage: "تمام، سأرسل لك التحاليل المطلوبة غداً في الصباح",
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    unreadCount: 2,
  },
  {
    id: "conv-2",
    doctor: {
      id: "doc-2",
      name: "د. سارة الناصري",
      specialty: "الأمراض الجلدية والتجميل",
      imageUrl: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=150&h=150&fit=crop&crop=face",
      isOnline: false,
      location: "دبي - الإمارات",
    },
    lastMessage: "المرهم استخدميه مرتين يومياً صباحاً ومساءً",
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    unreadCount: 0,
  },
  {
    id: "conv-3",
    doctor: {
      id: "doc-3",
      name: "د. محمد العمري",
      specialty: "جراحة العظام والمفاصل",
      imageUrl: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=150&h=150&fit=crop&crop=face",
      isOnline: true,
      location: "الرياض - السعودية",
    },
    lastMessage: "الأشعة واضحة تماماً، لا يوجد أي كسر أو خلل",
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    unreadCount: 0,
  },
  {
    id: "conv-4",
    doctor: {
      id: "doc-4",
      name: "د. ليلى الحسيني",
      specialty: "طب الأطفال",
      imageUrl: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&h=150&fit=crop&crop=face",
      isOnline: false,
      location: "القاهرة - مصر",
    },
    lastMessage: "الطفل بخير، الحرارة انخفضت والحالة مستقرة",
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    unreadCount: 1,
  },
];

const MOCK_MESSAGES: Record<string, Message[]> = {
  "conv-1": [
    {
      id: "m1",
      senderId: "doc-1",
      content: "مرحباً أحمد، كيف حالك اليوم؟ هل الألم لا يزال مستمراً؟",
      createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      sender: { id: "doc-1", name: "د. أحمد الخالدي", imageUrl: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150&h=150&fit=crop&crop=face" },
      read: true,
    },
    {
      id: "m2",
      senderId: "patient",
      content: "الحمدلله بخير دكتور، لكنني أشعر بألم خفيف في الجانب الأيسر من الصدر عند المجهود",
      createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
      sender: { id: "patient", name: "أنت" },
      read: true,
      status: "read",
    },
    {
      id: "m3",
      senderId: "doc-1",
      content: "أفهم. هذا قد يكون مؤشراً على ضغط على القلب. هل الألم يمتد للذراع أو الفك؟",
      createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
      sender: { id: "doc-1", name: "د. أحمد الخالدي", imageUrl: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150&h=150&fit=crop&crop=face" },
      read: true,
    },
    {
      id: "m4",
      senderId: "patient",
      content: "لا لا، الألم محصور في الصدر فقط ويختفي عند الراحة",
      createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      sender: { id: "patient", name: "أنت" },
      read: true,
      status: "read",
    },
    {
      id: "m5",
      senderId: "doc-1",
      content: "جيد. أنصحك بعمل رسم قلب (ECG) وتحليل إنزيمات القلب CK-MB و Troponin. هل يمكنك الحضور غداً صباحاً؟",
      createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
      sender: { id: "doc-1", name: "د. أحمد الخالدي", imageUrl: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150&h=150&fit=crop&crop=face" },
      read: true,
    },
    {
      id: "m6",
      senderId: "patient",
      content: "نعم بالتأكيد دكتور، سأكون هناك في تمام التاسعة صباحاً إن شاء الله",
      createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      sender: { id: "patient", name: "أنت" },
      read: true,
      status: "read",
    },
    {
      id: "m7",
      senderId: "doc-1",
      content: "تمام، سأرسل لك التحاليل المطلوبة غداً في الصباح",
      createdAt: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
      sender: { id: "doc-1", name: "د. أحمد الخالدي", imageUrl: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150&h=150&fit=crop&crop=face" },
      read: false,
    },
    {
      id: "m8",
      senderId: "doc-1",
      content: "تذكر أن تأتي صائماً 8 ساعات على الأقل للتحاليل، وإحضر تقاريرك السابقة إن وجدت",
      createdAt: new Date(Date.now() - 1000 * 30).toISOString(),
      sender: { id: "doc-1", name: "د. أحمد الخالدي", imageUrl: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150&h=150&fit=crop&crop=face" },
      read: false,
    },
  ],
};

// ── Helpers ─────────────────────────────────────────────────────────────
const formatMessageTime = (d: string) => {
  try { return format(new Date(d), "h:mm a", { locale: ar }); } catch { return ""; }
};

const formatRelativeTime = (d?: string) => {
  if (!d) return "";
  const now = Date.now();
  const then = new Date(d).getTime();
  const diff = now - then;

  if (diff < 60000) return "الآن";
  if (diff < 3600000) return `${Math.floor(diff / 60000)} د`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} س`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)} ي`;
  try { return format(new Date(d), "d MMM", { locale: ar }); } catch { return ""; }
};

// ── Conversation Card ───────────────────────────────────────────────────
function ConversationCard({
  conv,
  isActive,
  onClick,
}: {
  conv: Conversation;
  isActive: boolean;
  onClick: () => void;
}) {
  const unread = conv.unreadCount || 0;

  return (
    <button
      onClick={onClick}
      className="w-full text-right transition-all duration-200 group relative"
      style={{
        background: isActive ? theme.primaryLight : "transparent",
      }}
    >
      {/* Active indicator */}
      {isActive && (
        <div 
          className="absolute right-0 top-4 bottom-4 w-1 rounded-l-full" 
          style={{ background: theme.primary }}
        />
      )}

      <div
        className="flex items-start gap-3 p-4 mx-2 my-1 rounded-xl transition-all"
        style={{
          background: isActive ? "white" : "transparent",
          boxShadow: isActive ? theme.shadowMd : "none",
          border: isActive ? `1px solid ${theme.primaryMid}` : "1px solid transparent",
        }}
      >
        {/* Avatar with status */}
        <div className="relative flex-shrink-0">
          <Avatar 
            className="h-12 w-12 ring-2 ring-offset-2 transition-all"
            style={{ 
              ringColor: isActive ? theme.primary : "transparent",
              ringOffsetColor: isActive ? "white" : "transparent",
            }}
          >
            <AvatarImage src={conv.doctor.imageUrl} className="object-cover" />
            <AvatarFallback
              className="text-white font-bold text-sm"
              style={{ background: `linear-gradient(135deg,${theme.primary},${theme.primaryDark})` }}
            >
              {conv.doctor.name?.split(" ").map(n => n[0]).join("") || "د"}
            </AvatarFallback>
          </Avatar>

          {/* Online status */}
          <span
            className="absolute -bottom-0.5 -left-0.5 w-3.5 h-3.5 rounded-full border-[2.5px] border-white"
            style={{ 
              background: conv.doctor.isOnline ? theme.online : theme.offline,
              boxShadow: conv.doctor.isOnline ? `0 0 0 2px ${theme.primaryMid}` : "none",
            }}
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pt-0.5">
          <div className="flex items-center justify-between mb-1">
            <h3 
              className="text-sm font-bold truncate"
              style={{ color: isActive ? theme.text : theme.text }}
            >
              {conv.doctor.name}
            </h3>
            {conv.lastMessageTime && (
              <span 
                className="text-[11px] flex-shrink-0 font-medium"
                style={{ color: unread > 0 ? theme.primary : theme.textMuted }}
              >
                {formatRelativeTime(conv.lastMessageTime)}
              </span>
            )}
          </div>

          <p className="text-[11px] font-medium mb-1.5" style={{ color: theme.primary }}>
            {conv.doctor.specialty}
          </p>

          <div className="flex items-center justify-between gap-2">
            <p
              className="text-xs truncate flex-1 leading-relaxed"
              style={{
                color: unread > 0 ? theme.text : theme.textMuted,
                fontWeight: unread > 0 ? 600 : 400,
              }}
            >
              {conv.lastMessage || "لا توجد رسائل"}
            </p>

            {unread > 0 && (
              <span
                className="flex-shrink-0 min-w-[22px] h-[22px] rounded-full flex items-center justify-center text-[11px] font-bold text-white px-1.5"
                style={{ 
                  background: theme.unread,
                  boxShadow: "0 2px 4px rgba(239,68,68,0.3)",
                }}
              >
                {unread}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

// ── Message Bubble ──────────────────────────────────────────────────────
function MessageBubble({
  message,
  isOwn,
  showAvatar,
}: {
  message: Message;
  isOwn: boolean;
  showAvatar: boolean;
}) {
  return (
    <div className={`flex gap-3 ${isOwn ? "flex-row-reverse" : "flex-row"} mb-4`}>
      {/* Avatar */}
      {showAvatar && !isOwn ? (
        <Avatar className="h-8 w-8 flex-shrink-0 mt-1 ring-2" style={{ ringColor: theme.primaryMid }}>
          <AvatarImage src={message.sender?.imageUrl} className="object-cover" />
          <AvatarFallback className="text-[10px] text-white font-bold" style={{ background: theme.primary }}>
            {message.sender?.name?.split(" ").map(n => n[0]).join("") || "د"}
          </AvatarFallback>
        </Avatar>
      ) : (
        <div className="w-8 flex-shrink-0" />
      )}

      {/* Message Content */}
      <div className={`max-w-[75%] ${isOwn ? "items-start" : "items-end"}`}>
        {/* Sender name */}
        {!isOwn && showAvatar && (
          <p className="text-[11px] font-semibold mb-1 mr-1" style={{ color: theme.textSecondary }}>
            {message.sender?.name}
          </p>
        )}

        <div
          className="relative px-4 py-3 rounded-2xl text-sm leading-relaxed"
          style={{
            background: isOwn
              ? `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})`
              : theme.bgCard,
            color: isOwn ? "white" : theme.text,
            border: isOwn ? "none" : `1px solid ${theme.borderLight}`,
            borderBottomRightRadius: isOwn ? "4px" : undefined,
            borderBottomLeftRadius: !isOwn ? "4px" : undefined,
            boxShadow: isOwn
              ? "0 4px 12px rgba(13,148,136,0.2)"
              : theme.shadowSm,
          }}
        >
          <p className="text-[13px] leading-relaxed">{message.content}</p>

          {/* Time & Status */}
          <div className={`flex items-center gap-1.5 mt-2 ${isOwn ? "justify-start" : "justify-end"}`}>
            <span 
              className="text-[10px] font-medium"
              style={{ color: isOwn ? "rgba(255,255,255,0.7)" : theme.textMuted }}
            >
              {formatMessageTime(message.createdAt)}
            </span>

            {isOwn && (
              <span className="flex items-center gap-0.5">
                {message.status === "read" ? (
                  <CheckCheck className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.95)" }} />
                ) : message.status === "sent" ? (
                  <Check className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.6)" }} />
                ) : (
                  <Clock className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.5)" }} />
                )}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Typing Indicator ────────────────────────────────────────────────────
function TypingIndicator({ name }: { name: string }) {
  return (
    <div className="flex items-end gap-2 mb-4 mr-11">
      <Avatar className="h-7 w-7 ring-2" style={{ ringColor: theme.primaryMid }}>
        <AvatarFallback className="text-[9px] text-white font-bold" style={{ background: theme.primary }}>
          {name?.split(" ").map(n => n[0]).join("") || "د"}
        </AvatarFallback>
      </Avatar>
      <div
        className="px-5 py-4 rounded-2xl rounded-br-sm"
        style={{ 
          background: theme.bgCard, 
          border: `1px solid ${theme.borderLight}`,
          boxShadow: theme.shadowSm,
        }}
      >
        <div className="flex items-center gap-1">
          <span 
            className="w-2 h-2 rounded-full animate-bounce" 
            style={{ background: theme.textMuted, animationDelay: "0ms", animationDuration: "0.6s" }} 
          />
          <span 
            className="w-2 h-2 rounded-full animate-bounce" 
            style={{ background: theme.textMuted, animationDelay: "150ms", animationDuration: "0.6s" }} 
          />
          <span 
            className="w-2 h-2 rounded-full animate-bounce" 
            style={{ background: theme.textMuted, animationDelay: "300ms", animationDuration: "0.6s" }} 
          />
        </div>
      </div>
    </div>
  );
}

// ── Chat Input ──────────────────────────────────────────────────────────
function ChatInputArea({
  onSend,
  isSending,
}: {
  onSend: (text: string) => void;
  isSending: boolean;
}) {
  const [text, setText] = useState("");
  const [showAttach, setShowAttach] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if (!text.trim() || isSending) return;
    onSend(text.trim());
    setText("");
    setShowAttach(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div 
      className="px-5 py-4 border-t"
      style={{ 
        background: theme.bgCard, 
        borderColor: theme.borderLight,
      }}
    >
      {/* Attachment Menu */}
      {showAttach && (
        <div className="flex gap-2 mb-3">
          {[
            { icon: <Image className="w-4 h-4" />, label: "صورة", color: "#0d9488" },
            { icon: <FileText className="w-4 h-4" />, label: "ملف PDF", color: "#7c3aed" },
            { icon: <Mic className="w-4 h-4" />, label: "صوتي", color: "#f59e0b" },
          ].map((item, i) => (
            <button
              key={i}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium transition-all hover:scale-105"
              style={{ 
                background: `${item.color}10`,
                color: item.color,
                border: `1px solid ${item.color}20`,
              }}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3">
        {/* Attachment button */}
        <button
          onClick={() => setShowAttach(!showAttach)}
          className="p-3 rounded-xl transition-all hover:scale-105 flex-shrink-0"
          style={{ 
            color: showAttach ? theme.primary : theme.textMuted,
            background: showAttach ? theme.primaryLight : "transparent",
          }}
        >
          <Paperclip className="w-5 h-5" />
        </button>

        {/* Input */}
        <div
          className="flex-1 flex items-center gap-2 px-5 py-3 rounded-2xl transition-all"
          style={{ 
            background: theme.bgMain, 
            border: `1px solid ${theme.border}`,
          }}
        >
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="اكتب رسالتك هنا..."
            className="flex-1 bg-transparent text-sm outline-none text-right font-medium"
            style={{ color: theme.text }}
            dir="rtl"
          />
        </div>

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={!text.trim() || isSending}
          className="p-3.5 rounded-xl transition-all hover:scale-105 flex-shrink-0 disabled:opacity-40 disabled:hover:scale-100"
          style={{
            background: text.trim() 
              ? `linear-gradient(135deg,${theme.primary},${theme.primaryDark})` 
              : theme.borderLight,
            color: text.trim() ? "white" : theme.textMuted,
            boxShadow: text.trim() ? "0 4px 12px rgba(13,148,136,0.25)" : "none",
          }}
        >
          {isSending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>
    </div>
  );
}

// ── Empty States ────────────────────────────────────────────────────────
function EmptyChatState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <div
        className="w-20 h-20 rounded-3xl flex items-center justify-center mb-5"
        style={{ 
          background: theme.primaryLight, 
          border: `2px dashed ${theme.primaryMid}`,
        }}
      >
        <MessageSquare className="w-10 h-10" style={{ color: theme.primary }} />
      </div>
      <h3 className="font-bold text-base mb-2" style={{ color: theme.text }}>
        اختر محادثة للبدء
      </h3>
      <p className="text-sm max-w-xs leading-relaxed" style={{ color: theme.textMuted }}>
        اختر طبيباً من القائمة الجانبية لعرض سجل المحادثات والتواصل المباشر
      </p>
    </div>
  );
}

function EmptyConversationsState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-6">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
        style={{ 
          background: theme.primaryLight, 
          border: `2px dashed ${theme.primaryMid}`,
        }}
      >
        <Stethoscope className="w-8 h-8" style={{ color: theme.primary }} />
      </div>
      <h3 className="font-bold text-sm mb-2" style={{ color: theme.text }}>
        لا توجد محادثات
      </h3>
      <p className="text-xs leading-relaxed" style={{ color: theme.textMuted }}>
        احجز موعداً مع طبيب لبدء محادثة والحصول على استشارة
      </p>
    </div>
  );
}

// ── Doctor Header Info ──────────────────────────────────────────────────
function DoctorHeaderInfo({ doctor }: { doctor: Doctor }) {
  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        <Avatar className="h-11 w-11 ring-2 ring-offset-2" style={{ ringColor: theme.primaryMid, ringOffsetColor: "white" }}>
          <AvatarImage src={doctor.imageUrl} className="object-cover" />
          <AvatarFallback className="text-white font-bold text-sm" style={{ background: `linear-gradient(135deg,${theme.primary},${theme.primaryDark})` }}>
            {doctor.name?.split(" ").map(n => n[0]).join("") || "د"}
          </AvatarFallback>
        </Avatar>
        <span
          className="absolute -bottom-0.5 -left-0.5 w-3 h-3 rounded-full border-[2.5px] border-white"
          style={{ 
            background: doctor.isOnline ? theme.online : theme.offline,
            boxShadow: doctor.isOnline ? `0 0 0 2px ${theme.primaryMid}` : "none",
          }}
        />
      </div>

      <div>
        <h3 className="text-sm font-bold" style={{ color: theme.text }}>
          {doctor.name}
        </h3>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-md" style={{ background: theme.primaryLight, color: theme.primary }}>
            {doctor.specialty}
          </span>
          <span className="w-px h-3" style={{ background: theme.border }} />
          <span
            className="text-[11px] flex items-center gap-1 font-medium"
            style={{ color: doctor.isOnline ? theme.online : theme.textMuted }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: doctor.isOnline ? theme.online : theme.offline }}
            />
            {doctor.isOnline ? "متصل الآن" : "غير متصل"}
          </span>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN: PatientChatLayout - Clean Medical Design
// ═══════════════════════════════════════════════════════════════════════
export default function PatientChatLayout({ currentUserId = "patient" }: { currentUserId?: string }) {
  const [conversations, setConversations] = useState<Conversation[]>(MOCK_CONVERSATIONS);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const bottomRef = useRef<HTMLDivElement>(null);

  const selectedConv = conversations.find((c) => c.id === selectedConvId);

  const filteredConversations = conversations.filter(
    (c) =>
      c.doctor.name.includes(searchQuery) ||
      c.doctor.specialty.includes(searchQuery) ||
      (c.lastMessage && c.lastMessage.includes(searchQuery))
  );

  // Load messages
  useEffect(() => {
    if (!selectedConvId) {
      setMessages([]);
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      setMessages(MOCK_MESSAGES[selectedConvId] || []);
      setIsLoading(false);
      setConversations((prev) =>
        prev.map((c) => (c.id === selectedConvId ? { ...c, unreadCount: 0 } : c))
      );
    }, 400);
  }, [selectedConvId]);

  // Auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Simulate typing
  useEffect(() => {
    if (!selectedConvId) return;
    const timer = setTimeout(() => {
      setIsTyping(true);
      setTimeout(() => setIsTyping(false), 3500);
    }, 6000);
    return () => clearTimeout(timer);
  }, [selectedConvId, messages.length]);

  const handleSendMessage = (text: string) => {
    const newMessage: Message = {
      id: `temp-${Date.now()}`,
      senderId: currentUserId,
      content: text,
      createdAt: new Date().toISOString(),
      sender: { id: currentUserId, name: "أنت" },
      status: "sent",
      read: false,
    };

    setMessages((prev) => [...prev, newMessage]);

    setConversations((prev) =>
      prev.map((c) =>
        c.id === selectedConvId
          ? { ...c, lastMessage: text, lastMessageTime: new Date().toISOString() }
          : c
      )
    );

    // Simulate reply
    setTimeout(() => {
      const reply: Message = {
        id: `reply-${Date.now()}`,
        senderId: selectedConv?.doctor.id || "doc",
        content: "تم استلام رسالتك، سأقوم بالرد عليك في أقرب وقت ممكن",
        createdAt: new Date().toISOString(),
        sender: {
          id: selectedConv?.doctor.id || "doc",
          name: selectedConv?.doctor.name || "الطبيب",
          imageUrl: selectedConv?.doctor.imageUrl,
        },
        read: false,
      };
      setMessages((prev) => [...prev, reply]);
      setConversations((prev) =>
        prev.map((c) =>
          c.id === selectedConvId
            ? { ...c, lastMessage: reply.content, lastMessageTime: reply.createdAt }
            : c
        )
      );
    }, 2500);
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = format(new Date(message.createdAt), "yyyy-MM-dd");
    if (!groups[date]) groups[date] = [];
    groups[date].push(message);
    return groups;
  }, {} as Record<string, Message[]>);

  return (
    <div
      className="w-full rounded-2xl overflow-hidden flex flex-col lg:flex-row"
      style={{
        background: theme.bgCard,
        border: `1px solid ${theme.border}`,
        boxShadow: theme.shadowLg,
        minHeight: "600px",
        maxHeight: "calc(100vh - 240px)",
      }}
      dir="rtl"
    >
      {/* ════════════════════════════════════════════════════════════════
          LEFT COLUMN: Conversations List
         ════════════════════════════════════════════════════════════════ */}
      <aside
        className="w-full lg:w-[320px] flex-shrink-0 flex flex-col"
        style={{ 
          borderLeft: `1px solid ${theme.borderLight}`,
          background: theme.bgMain,
        }}
      >
        {/* Header */}
        <div 
          className="px-5 py-4"
          style={{ 
            borderBottom: `1px solid ${theme.borderLight}`,
            background: theme.bgCard,
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div 
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: theme.primaryLight }}
              >
                <MessageSquare className="w-5 h-5" style={{ color: theme.primary }} />
              </div>
              <div>
                <h2 className="text-sm font-bold" style={{ color: theme.text }}>
                  المحادثات
                </h2>
                <p className="text-[11px]" style={{ color: theme.textMuted }}>
                  {conversations.length} محادثة نشطة
                </p>
              </div>
            </div>

            <span
              className="text-[10px] font-bold px-2.5 py-1 rounded-full"
              style={{ 
                background: theme.primaryLight, 
                color: theme.primary,
              }}
            >
              {conversations.reduce((sum, c) => sum + c.unreadCount, 0)} جديد
            </span>
          </div>

          {/* Search */}
          <div className="relative">
            <Search 
              className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4" 
              style={{ color: theme.textMuted }} 
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="البحث في المحادثات..."
              className="w-full pr-10 pl-4 py-2.5 rounded-xl text-xs text-right outline-none transition-all font-medium"
              style={{ 
                background: theme.bgMain, 
                border: `1px solid ${theme.border}`,
                color: theme.text,
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = theme.primary;
                e.currentTarget.style.boxShadow = `0 0 0 3px ${theme.primaryMid}`;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = theme.border;
                e.currentTarget.style.boxShadow = "none";
              }}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")} 
                className="absolute left-3 top-1/2 -translate-y-1/2"
              >
                <X className="w-3.5 h-3.5" style={{ color: theme.textMuted }} />
              </button>
            )}
          </div>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto py-2">
          {filteredConversations.length === 0 ? (
            <EmptyConversationsState />
          ) : (
            filteredConversations.map((conv) => (
              <ConversationCard
                key={conv.id}
                conv={conv}
                isActive={conv.id === selectedConvId}
                onClick={() => setSelectedConvId(conv.id)}
              />
            ))
          )}
        </div>
      </aside>

      {/* ════════════════════════════════════════════════════════════════
          RIGHT COLUMN: Chat Window
         ════════════════════════════════════════════════════════════════ */}
      <main className="flex-1 flex flex-col min-w-0 bg-white relative">
        {!selectedConvId ? (
          <EmptyChatState />
        ) : (
          <>
            {/* Chat Header */}
            <div
              className="px-5 py-3.5 flex items-center justify-between flex-shrink-0"
              style={{ 
                borderBottom: `1px solid ${theme.borderLight}`,
                background: theme.bgCard,
              }}
            >
              <DoctorHeaderInfo doctor={selectedConv.doctor} />

              <div className="flex items-center gap-1">
                <button
                  className="p-2.5 rounded-xl transition-all hover:scale-105"
                  style={{ color: theme.textMuted }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = theme.primaryLight)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <Phone className="w-4 h-4" />
                </button>
                <button
                  className="p-2.5 rounded-xl transition-all hover:scale-105"
                  style={{ color: theme.textMuted }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = theme.primaryLight)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <Video className="w-4 h-4" />
                </button>
                <button
                  className="p-2.5 rounded-xl transition-all hover:scale-105"
                  style={{ color: theme.textMuted }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = theme.primaryLight)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div
              className="flex-1 overflow-y-auto px-5 py-5"
              style={{ background: theme.bgMain }}
            >
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin" style={{ color: theme.primary }} />
                    <p className="text-xs font-medium" style={{ color: theme.textMuted }}>
                      جاري تحميل الرسائل...
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {Object.entries(groupedMessages).map(([date, dateMessages]) => (
                    <div key={date}>
                      {/* Date Separator */}
                      <div className="flex items-center justify-center my-5">
                        <div
                          className="px-4 py-1.5 rounded-full text-[11px] font-bold"
                          style={{ 
                            background: theme.bgCard, 
                            color: theme.textMuted,
                            border: `1px solid ${theme.borderLight}`,
                            boxShadow: theme.shadowSm,
                          }}
                        >
                          {format(new Date(date), "EEEE، d MMMM yyyy", { locale: ar })}
                        </div>
                      </div>

                      <div className="space-y-1">
                        {dateMessages.map((msg, index) => {
                          const isOwn = msg.senderId === currentUserId;
                          const prevMsg = index > 0 ? dateMessages[index - 1] : null;
                          const showAvatar = !prevMsg || prevMsg.senderId !== msg.senderId;
                          return (
                            <MessageBubble
                              key={msg.id}
                              message={msg}
                              isOwn={isOwn}
                              showAvatar={showAvatar}
                            />
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  {isTyping && <TypingIndicator name={selectedConv.doctor.name} />}
                  <div ref={bottomRef} />
                </>
              )}
            </div>

            {/* Input */}
            <ChatInputArea onSend={handleSendMessage} isSending={isSending} />
          </>
        )}
      </main>
    </div>
  );
}