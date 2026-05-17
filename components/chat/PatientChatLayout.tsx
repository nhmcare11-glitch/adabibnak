"use client";

import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import {
  MessageSquare, Search, Send, Paperclip, Mic, Image, FileText,
  Check, CheckCheck, Clock, MoreVertical, Phone, Video,
  ChevronLeft, X, Loader2, Stethoscope
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// ── Design Tokens (متناسقة مع الداشبورد) ───────────────────────────────
const C = {
  primary:      "#0d9488",
  primaryDark:  "#0f766e",
  primaryLight: "#f0fdfb",
  primaryMid:   "#ccfbf1",
  text:         "#134e4a",
  textMid:      "#2d7a72",
  textLight:    "#5eaaa4",
  bg:           "#f0fdfb",
  white:        "#ffffff",
  border:       "#ccfbf1",
  patientMsg:   "#0d9488",
  doctorMsg:    "#f0fdfa",
  doctorText:   "#134e4a",
  unread:       "#ef4444",
  online:       "#10b981",
  offline:      "#9ca3af",
};

// ── Types ─────────────────────────────────────────────────────────────────
interface Doctor {
  id: string;
  name: string;
  imageUrl?: string;
  specialty: string;
  isOnline?: boolean;
}

interface Message {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
  sender: { id: string; name: string; imageUrl?: string };
  files?: Array<{ name: string; type: string; url?: string; size?: number }>;
  read?: boolean;
  status?: "sending" | "sent" | "delivered" | "read";
  isTemp?: boolean;
}

interface Conversation {
  id: string;
  doctor: Doctor;
  patientId: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
  messages?: Message[];
}

// ── Mock Data (استبدل بـ API لاحقاً) ────────────────────────────────────
const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: "conv-1",
    patientId: "patient-1",
    doctor: {
      id: "doc-1",
      name: "د. أحمد الخالدي",
      specialty: "أمراض القلب",
      imageUrl: "https://i.pravatar.cc/150?u=doc1",
      isOnline: true,
    },
    lastMessage: "تمام، سأرسل لك التحاليل المطلوبة غداً",
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    unreadCount: 2,
  },
  {
    id: "conv-2",
    patientId: "patient-1",
    doctor: {
      id: "doc-2",
      name: "د. سارة الناصري",
      specialty: "جلدية",
      imageUrl: "https://i.pravatar.cc/150?u=doc2",
      isOnline: false,
    },
    lastMessage: "المرهم استخدميه مرتين يومياً",
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    unreadCount: 0,
  },
  {
    id: "conv-3",
    patientId: "patient-1",
    doctor: {
      id: "doc-3",
      name: "د. محمد العمري",
      specialty: "عظام",
      imageUrl: "https://i.pravatar.cc/150?u=doc3",
      isOnline: true,
    },
    lastMessage: "الأشعة واضحة، لا يوجد كسر",
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    unreadCount: 0,
  },
];

const MOCK_MESSAGES: Record<string, Message[]> = {
  "conv-1": [
    {
      id: "m1",
      senderId: "doc-1",
      content: "مرحباً، كيف حالك اليوم؟",
      createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      sender: { id: "doc-1", name: "د. أحمد الخالدي", imageUrl: "https://i.pravatar.cc/150?u=doc1" },
      read: true,
    },
    {
      id: "m2",
      senderId: "patient-1",
      content: "الحمدلله بخير دكتور، لكنني أشعر بألم خفيف في الصدر",
      createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
      sender: { id: "patient-1", name: "أنت" },
      read: true,
      status: "read",
    },
    {
      id: "m3",
      senderId: "doc-1",
      content: "أفهم. هل الألم مستمر أم يأتي ويذهب؟",
      createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
      sender: { id: "doc-1", name: "د. أحمد الخالدي", imageUrl: "https://i.pravatar.cc/150?u=doc1" },
      read: true,
    },
    {
      id: "m4",
      senderId: "patient-1",
      content: "يأتي عند المجهود فقط",
      createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      sender: { id: "patient-1", name: "أنت" },
      read: true,
      status: "read",
    },
    {
      id: "m5",
      senderId: "doc-1",
      content: "أنصحك بعمل رسم قلب (ECG) وتحليل إنزيمات القلب. هل يمكنك الحضور غداً؟",
      createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
      sender: { id: "doc-1", name: "د. أحمد الخالدي", imageUrl: "https://i.pravatar.cc/150?u=doc1" },
      read: true,
    },
    {
      id: "m6",
      senderId: "patient-1",
      content: "نعم سأحضر إن شاء الله",
      createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      sender: { id: "patient-1", name: "أنت" },
      read: true,
      status: "read",
    },
    {
      id: "m7",
      senderId: "doc-1",
      content: "تمام، سأرسل لك التحاليل المطلوبة غداً",
      createdAt: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
      sender: { id: "doc-1", name: "د. أحمد الخالدي", imageUrl: "https://i.pravatar.cc/150?u=doc1" },
      read: false,
    },
    {
      id: "m8",
      senderId: "doc-1",
      content: "تذكر أن تأتي صائماً 8 ساعات",
      createdAt: new Date(Date.now() - 1000 * 30).toISOString(),
      sender: { id: "doc-1", name: "د. أحمد الخالدي", imageUrl: "https://i.pravatar.cc/150?u=doc1" },
      read: false,
    },
  ],
};

// ── Helpers ─────────────────────────────────────────────────────────────
const formatMessageTime = (d: string) => {
  try { return format(new Date(d), "h:mm a", { locale: ar }); } catch { return ""; }
};

// ── Conversation List Item ────────────────────────────────────────────────
function ConversationItem({
  conv,
  isActive,
  onClick,
}: {
  conv: Conversation;
  isActive: boolean;
  onClick: () => void;
}) {
  const other = conv.doctor;
  const unread = conv.unreadCount || 0;

  return (
    <button
      onClick={onClick}
      className="w-full text-right transition-all duration-200 group"
      style={{
        background: isActive ? C.primaryLight : "transparent",
        borderRight: isActive ? `3px solid ${C.primary}` : "3px solid transparent",
      }}
    >
      <div
        className="flex items-center gap-3 p-3 mx-2 my-1 rounded-xl transition-all"
        style={{
          background: isActive ? "white" : "transparent",
          boxShadow: isActive ? "0 2px 8px rgba(13,148,136,0.08)" : "none",
        }}
        onMouseEnter={(e) => {
          if (!isActive) e.currentTarget.style.background = "rgba(13,148,136,0.04)";
        }}
        onMouseLeave={(e) => {
          if (!isActive) e.currentTarget.style.background = "transparent";
        }}
      >
        {/* Avatar with online indicator */}
        <div className="relative flex-shrink-0">
          <Avatar className="h-11 w-11 border-2" style={{ borderColor: isActive ? C.primary : C.border }}>
            <AvatarImage src={other.imageUrl} />
            <AvatarFallback
              className="text-white font-bold text-sm"
              style={{ background: `linear-gradient(135deg,${C.primary},#0891b2)` }}
            >
              {other.name?.charAt(0) || "د"}
            </AvatarFallback>
          </Avatar>
          <span
            className="absolute -bottom-0.5 -left-0.5 w-3 h-3 rounded-full border-2 border-white"
            style={{ background: other.isOnline ? C.online : C.offline }}
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <h3 className="text-sm font-semibold truncate" style={{ color: C.text }}>
              {other.name}
            </h3>
            {conv.lastMessageTime && (
              <span className="text-[11px] flex-shrink-0" style={{ color: C.textLight }}>
                {formatMessageTime(conv.lastMessageTime)}
              </span>
            )}
          </div>

          <p className="text-[11px] mb-0.5" style={{ color: C.primary }}>
            {other.specialty}
          </p>

          <div className="flex items-center justify-between">
            <p
              className="text-xs truncate flex-1"
              style={{
                color: unread > 0 ? C.text : C.textLight,
                fontWeight: unread > 0 ? 600 : 400,
              }}
            >
              {conv.lastMessage || "لا توجد رسائل"}
            </p>
            {unread > 0 && (
              <span
                className="flex-shrink-0 mr-2 min-w-[20px] h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white px-1.5"
                style={{ background: C.unread }}
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
function ChatMessageBubble({
  message,
  isOwn,
  showAvatar,
}: {
  message: Message;
  isOwn: boolean;
  showAvatar: boolean;
}) {
  const isFile = message.files && message.files.length > 0;
  const file = isFile ? message.files![0] : null;

  return (
    <div className={`flex gap-2 ${isOwn ? "flex-row-reverse" : "flex-row"} mb-3`}>
      {/* Avatar */}
      {showAvatar && !isOwn ? (
        <Avatar className="h-8 w-8 flex-shrink-0 mt-1 border" style={{ borderColor: C.border }}>
          <AvatarImage src={message.sender?.imageUrl} />
          <AvatarFallback className="text-[10px] text-white" style={{ background: C.primary }}>
            {message.sender?.name?.charAt(0) || "د"}
          </AvatarFallback>
        </Avatar>
      ) : (
        <div className="w-8 flex-shrink-0" />
      )}

      {/* Message Content */}
      <div className={`max-w-[75%] ${isOwn ? "items-start" : "items-end"}`}>
        {!isOwn && showAvatar && (
          <p className="text-[10px] font-medium mb-1 mr-1" style={{ color: C.textLight }}>
            {message.sender?.name}
          </p>
        )}

        <div
          className="relative px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed"
          style={{
            background: isOwn
              ? `linear-gradient(135deg, ${C.primary}, ${C.primaryDark})`
              : C.white,
            color: isOwn ? "white" : C.text,
            border: isOwn ? "none" : `1px solid ${C.border}`,
            borderBottomRightRadius: isOwn ? "4px" : undefined,
            borderBottomLeftRadius: !isOwn ? "4px" : undefined,
            boxShadow: isOwn
              ? "0 2px 8px rgba(13,148,136,0.25)"
              : "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          {/* File Attachment */}
          {isFile && file && (
            <div
              className="mb-2 p-2.5 rounded-xl flex items-center gap-2.5"
              style={{
                background: isOwn ? "rgba(255,255,255,0.15)" : C.primaryLight,
                border: isOwn ? "1px solid rgba(255,255,255,0.2)" : `1px solid ${C.border}`,
              }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: isOwn ? "rgba(255,255,255,0.2)" : C.primaryLight }}
              >
                {file.type?.includes("image") ? (
                  <Image className="w-4 h-4" style={{ color: isOwn ? "white" : C.primary }} />
                ) : file.type?.includes("pdf") ? (
                  <FileText className="w-4 h-4" style={{ color: isOwn ? "white" : C.primary }} />
                ) : (
                  <Paperclip className="w-4 h-4" style={{ color: isOwn ? "white" : C.primary }} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-medium truncate ${isOwn ? "text-white" : ""}`}>
                  {file.name}
                </p>
                {file.size && (
                  <p className={`text-[10px] ${isOwn ? "text-white/70" : "text-slate-400"}`}>
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Text */}
          <p className="text-[13px] leading-relaxed">{message.content}</p>

          {/* Time & Status */}
          <div className={`flex items-center gap-1 mt-1.5 ${isOwn ? "justify-start" : "justify-end"}`}>
            <span className="text-[10px]" style={{ color: isOwn ? "rgba(255,255,255,0.7)" : C.textLight }}>
              {formatMessageTime(message.createdAt)}
            </span>
            {isOwn && (
              <span className="mr-1">
                {message.status === "read" ? (
                  <CheckCheck className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.9)" }} />
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
function DoctorTypingIndicator({ name }: { name: string }) {
  return (
    <div className="flex items-end gap-2 mb-3 mr-10">
      <Avatar className="h-6 w-6 border" style={{ borderColor: C.border }}>
        <AvatarFallback className="text-[8px] text-white" style={{ background: C.primary }}>
          {name?.charAt(0) || "د"}
        </AvatarFallback>
      </Avatar>
      <div
        className="px-4 py-3 rounded-2xl rounded-br-sm"
        style={{ background: C.white, border: `1px solid ${C.border}` }}
      >
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: C.textLight, animationDelay: "0ms" }} />
          <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: C.textLight, animationDelay: "150ms" }} />
          <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: C.textLight, animationDelay: "300ms" }} />
        </div>
      </div>
    </div>
  );
}

// ── Chat Input ────────────────────────────────────────────────────────────
function ChatInputArea({
  onSend,
  isSending,
}: {
  onSend: (text: string, files?: File[]) => void;
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
    <div className="px-4 py-3 border-t" style={{ background: C.white, borderColor: C.border }}>
      {/* Attachment Menu */}
      {showAttach && (
        <div className="flex gap-2 mb-3 px-1">
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors"
            style={{ background: C.primaryLight, color: C.primary }}
          >
            <Image className="w-3.5 h-3.5" />
            صورة
          </button>
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors"
            style={{ background: C.primaryLight, color: C.primary }}
          >
            <FileText className="w-3.5 h-3.5" />
            ملف PDF
          </button>
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors"
            style={{ background: C.primaryLight, color: C.primary }}
          >
            <Mic className="w-3.5 h-3.5" />
            تسجيل صوتي
          </button>
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowAttach(!showAttach)}
          className="p-2.5 rounded-xl transition-colors flex-shrink-0"
          style={{ color: C.textLight }}
          onMouseEnter={(e) => (e.currentTarget.style.background = C.primaryLight)}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <Paperclip className="w-5 h-5" />
        </button>

        <div
          className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all"
          style={{ background: C.bg, border: `1px solid ${C.border}` }}
        >
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="اكتب رسالتك هنا..."
            className="flex-1 bg-transparent text-sm outline-none text-right"
            style={{ color: C.text }}
            dir="rtl"
          />
        </div>

        <button
          onClick={handleSend}
          disabled={!text.trim() || isSending}
          className="p-2.5 rounded-xl transition-all flex-shrink-0 disabled:opacity-40"
          style={{
            background: text.trim() ? `linear-gradient(135deg,${C.primary},${C.primaryDark})` : C.border,
            color: text.trim() ? "white" : C.textLight,
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
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: C.primaryLight, border: `1px solid ${C.border}` }}
      >
        <MessageSquare className="w-8 h-8" style={{ color: C.primary }} />
      </div>
      <h3 className="font-bold text-sm mb-1" style={{ color: C.text }}>
        اختر محادثة للبدء
      </h3>
      <p className="text-xs max-w-xs leading-relaxed" style={{ color: C.textLight }}>
        اختر طبيباً من القائمة الجانبية لعرض الرسائل والتواصل مباشرة
      </p>
    </div>
  );
}

function EmptyConversationsState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center px-4">
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
        style={{ background: C.primaryLight, border: `1px solid ${C.border}` }}
      >
        <Stethoscope className="w-7 h-7" style={{ color: C.primary }} />
      </div>
      <h3 className="font-bold text-sm mb-1" style={{ color: C.text }}>
        لا توجد محادثات
      </h3>
      <p className="text-xs" style={{ color: C.textLight }}>
        احجز موعداً مع طبيب لبدء محادثة
      </p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN: PatientChatLayout
// ═══════════════════════════════════════════════════════════════════════
export default function PatientChatLayout({ currentUserId = "patient-1" }: { currentUserId?: string }) {
  const [conversations, setConversations] = useState<Conversation[]>(MOCK_CONVERSATIONS);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const bottomRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const selectedConv = conversations.find((c) => c.id === selectedConvId);
  const filteredConversations = conversations.filter(
    (c) =>
      c.doctor.name.includes(searchQuery) ||
      c.doctor.specialty.includes(searchQuery) ||
      (c.lastMessage && c.lastMessage.includes(searchQuery))
  );

  // Load messages when conversation selected
  useEffect(() => {
    if (!selectedConvId) {
      setMessages([]);
      return;
    }
    setIsLoading(true);
    // Simulate API call - استبدل هذا بـ fetch حقيقي
    setTimeout(() => {
      setMessages(MOCK_MESSAGES[selectedConvId] || []);
      setIsLoading(false);
      // Mark as read
      setConversations((prev) =>
        prev.map((c) => (c.id === selectedConvId ? { ...c, unreadCount: 0 } : c))
      );
    }, 300);
  }, [selectedConvId]);

  // Auto scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Simulate doctor typing
  useEffect(() => {
    if (!selectedConvId) return;
    const timer = setTimeout(() => {
      setIsTyping(true);
      setTimeout(() => setIsTyping(false), 3000);
    }, 5000);
    return () => clearTimeout(timer);
  }, [selectedConvId, messages.length]);

  const handleSendMessage = (text: string, files?: File[]) => {
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

    // Simulate reply after 2 seconds
    setTimeout(() => {
      const reply: Message = {
        id: `reply-${Date.now()}`,
        senderId: selectedConv?.doctor.id || "doc",
        content: "تم استلام رسالتك، سأرد عليك قريباً",
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
    }, 2000);
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
        background: C.white,
        border: `1px solid ${C.border}`,
        boxShadow: "0 4px 24px rgba(13,148,136,0.06)",
        minHeight: "600px",
        maxHeight: "calc(100vh - 240px)",
      }}
      dir="rtl"
    >
      {/* ── LEFT: Conversations List ── */}
      <aside
        className="w-full lg:w-80 flex-shrink-0 flex flex-col border-l"
        style={{ borderColor: C.border, background: C.bg }}
      >
        {/* Header */}
        <div className="p-4 border-b" style={{ borderColor: C.border, background: C.white }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-sm flex items-center gap-2" style={{ color: C.text }}>
              <MessageSquare className="w-4 h-4" style={{ color: C.primary }} />
              المحادثات
            </h2>
            <span
              className="text-[10px] font-medium px-2 py-0.5 rounded-full"
              style={{ background: C.primaryLight, color: C.primary }}
            >
              {conversations.length}
            </span>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: C.textLight }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="البحث في المحادثات..."
              className="w-full pr-9 pl-3 py-2 rounded-xl text-xs text-right outline-none transition-all"
              style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.text }}
              onFocus={(e) => (e.currentTarget.style.borderColor = C.primary)}
              onBlur={(e) => (e.currentTarget.style.borderColor = C.border)}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute left-3 top-1/2 -translate-y-1/2">
                <X className="w-3.5 h-3.5" style={{ color: C.textLight }} />
              </button>
            )}
          </div>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <EmptyConversationsState />
          ) : (
            filteredConversations.map((conv) => (
              <ConversationItem
                key={conv.id}
                conv={conv}
                isActive={conv.id === selectedConvId}
                onClick={() => setSelectedConvId(conv.id)}
              />
            ))
          )}
        </div>
      </aside>

      {/* ── RIGHT: Chat Window ── */}
      <main className="flex-1 flex flex-col min-w-0 bg-white relative">
        {!selectedConvId ? (
          <EmptyChatState />
        ) : (
          <>
            {/* Chat Header */}
            <div
              className="px-4 py-3 flex items-center justify-between border-b flex-shrink-0"
              style={{ borderColor: C.border, background: C.white }}
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className="h-10 w-10 border-2" style={{ borderColor: C.border }}>
                    <AvatarImage src={selectedConv.doctor.imageUrl} />
                    <AvatarFallback
                      className="text-white font-bold text-sm"
                      style={{ background: `linear-gradient(135deg,${C.primary},#0891b2)` }}
                    >
                      {selectedConv.doctor.name?.charAt(0) || "د"}
                    </AvatarFallback>
                  </Avatar>
                  <span
                    className="absolute -bottom-0.5 -left-0.5 w-2.5 h-2.5 rounded-full border-2 border-white"
                    style={{ background: selectedConv.doctor.isOnline ? C.online : C.offline }}
                  />
                </div>

                <div>
                  <h3 className="text-sm font-bold" style={{ color: C.text }}>
                    {selectedConv.doctor.name}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px]" style={{ color: C.primary }}>
                      {selectedConv.doctor.specialty}
                    </span>
                    <span className="w-px h-3" style={{ background: C.border }} />
                    <span
                      className="text-[11px] flex items-center gap-1"
                      style={{ color: selectedConv.doctor.isOnline ? C.online : C.textLight }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: selectedConv.doctor.isOnline ? C.online : C.offline }}
                      />
                      {selectedConv.doctor.isOnline ? "متصل الآن" : "غير متصل"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  className="p-2 rounded-xl transition-colors"
                  style={{ color: C.textLight }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = C.primaryLight)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <Phone className="w-4 h-4" />
                </button>
                <button
                  className="p-2 rounded-xl transition-colors"
                  style={{ color: C.textLight }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = C.primaryLight)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <Video className="w-4 h-4" />
                </button>
                <button
                  className="p-2 rounded-xl transition-colors"
                  style={{ color: C.textLight }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = C.primaryLight)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto px-4 py-4"
              style={{ background: C.bg }}
            >
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-6 h-6 animate-spin" style={{ color: C.primary }} />
                </div>
              ) : (
                <>
                  {Object.entries(groupedMessages).map(([date, dateMessages]) => (
                    <div key={date}>
                      <div className="flex items-center justify-center my-4">
                        <div
                          className="px-4 py-1.5 rounded-full text-[11px] font-medium"
                          style={{ background: C.white, color: C.textLight, border: `1px solid ${C.border}` }}
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
                            <ChatMessageBubble
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

                  {isTyping && <DoctorTypingIndicator name={selectedConv.doctor.name} />}
                  <div ref={bottomRef} />
                </>
              )}
            </div>

            {/* Input */}
            <ChatInputArea onSend={handleSendMessage} isSending={false} />
          </>
        )}
      </main>
    </div>
  );
}