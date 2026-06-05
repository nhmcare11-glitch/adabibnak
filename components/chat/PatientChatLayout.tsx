"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import {
  MessageSquare, Search, Send, Paperclip, Mic, Image, FileText,
  Check, CheckCheck, MoreVertical, Phone, Video,
  X, Loader2, Stethoscope, Smile,
} from "lucide-react";
import EmojiPicker, { Theme } from "emoji-picker-react";
import { useTheme } from "next-themes";

// ── Design tokens ─────────────────────────────────────────────────────────
const T = {
  primary:      "#0d7377",
  primaryHover: "#0a5c5f",
  primaryLight: "#f0fafa",
  primaryBorder:"#c5e5e5",
  bg:           "#f5f9f9",
  white:        "#ffffff",
  border:       "#e0eeee",
  text:         "#0d3d3d",
  textMid:      "#3d7070",
  textLight:    "#6b9e9e",
  textMuted:    "#94b5b5",
  online:       "#22c55e",
  offline:      "#9ca3af",
  unread:       "#ef4444",
  msgOwn:       "#0d7377",
  msgOther:     "#ffffff",
};

// ── Types ─────────────────────────────────────────────────────────────────
interface Doctor {
  id: string;
  name: string;
  imageUrl?: string;
  specialty: string;
  isOnline?: boolean;
}

interface FileItem {
  name: string;
  type: string;
  url?: string;
  size?: number;
}

interface Message {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
  sender: { id: string; name: string; imageUrl?: string };
  files?: FileItem[];
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

// ── Mock data ─────────────────────────────────────────────────────────────
const CURRENT_USER_ID = "patient-1";

const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: "conv-1",
    patientId: CURRENT_USER_ID,
    doctor: { id: "doc-1", name: "د. أحمد الخالدي", specialty: "أمراض القلب", isOnline: true },
    lastMessage: "تمام، سأرسل لك التحاليل المطلوبة غداً",
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    unreadCount: 2,
  },
  {
    id: "conv-2",
    patientId: CURRENT_USER_ID,
    doctor: { id: "doc-2", name: "د. سارة الناصري", specialty: "جلدية", isOnline: false },
    lastMessage: "المرهم استخدميه مرتين يومياً",
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    unreadCount: 0,
  },
  {
    id: "conv-3",
    patientId: CURRENT_USER_ID,
    doctor: { id: "doc-3", name: "د. محمد العمري", specialty: "عظام", isOnline: true },
    lastMessage: "الأشعة واضحة، لا يوجد كسر",
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    unreadCount: 0,
  },
];

const MOCK_MESSAGES: Record<string, Message[]> = {
  "conv-1": [
    { id: "m1", senderId: "doc-1", content: "مرحباً، كيف حالك اليوم؟", createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), sender: { id: "doc-1", name: "د. أحمد الخالدي" }, read: true },
    { id: "m2", senderId: CURRENT_USER_ID, content: "الحمدلله بخير دكتور، لكنني أشعر بألم خفيف في الصدر", createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(), sender: { id: CURRENT_USER_ID, name: "أنت" }, read: true, status: "read" },
    { id: "m3", senderId: "doc-1", content: "أفهم. هل الألم مستمر أم يأتي ويذهب؟", createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(), sender: { id: "doc-1", name: "د. أحمد الخالدي" }, read: true },
    { id: "m4", senderId: CURRENT_USER_ID, content: "يأتي عند المجهود فقط", createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(), sender: { id: CURRENT_USER_ID, name: "أنت" }, read: true, status: "read" },
    { id: "m5", senderId: "doc-1", content: "أنصحك بعمل رسم قلب (ECG) وتحليل إنزيمات القلب. هل يمكنك الحضور غداً؟", createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(), sender: { id: "doc-1", name: "د. أحمد الخالدي" }, read: true },
    { id: "m6", senderId: CURRENT_USER_ID, content: "نعم سأحضر إن شاء الله", createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(), sender: { id: CURRENT_USER_ID, name: "أنت" }, read: true, status: "read" },
    { id: "m7", senderId: "doc-1", content: "تمام، سأرسل لك التحاليل المطلوبة غداً", createdAt: new Date(Date.now() - 1000 * 60 * 2).toISOString(), sender: { id: "doc-1", name: "د. أحمد الخالدي" }, read: false },
    { id: "m8", senderId: "doc-1", content: "تذكر أن تأتي صائماً 8 ساعات", createdAt: new Date(Date.now() - 30000).toISOString(), sender: { id: "doc-1", name: "د. أحمد الخالدي" }, read: false },
  ],
  "conv-2": [
    { id: "n1", senderId: "doc-2", content: "مرحباً، شوفي الصورة المرفقة للمرهم", createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), sender: { id: "doc-2", name: "د. سارة الناصري" }, read: true },
    { id: "n2", senderId: CURRENT_USER_ID, content: "شكراً دكتورة", createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2.5).toISOString(), sender: { id: CURRENT_USER_ID, name: "أنت" }, read: true, status: "read" },
    { id: "n3", senderId: "doc-2", content: "المرهم استخدميه مرتين يومياً", createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), sender: { id: "doc-2", name: "د. سارة الناصري" }, read: true },
  ],
  "conv-3": [
    { id: "o1", senderId: "doc-3", content: "الأشعة واضحة، لا يوجد كسر", createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), sender: { id: "doc-3", name: "د. محمد العمري" }, read: true },
  ],
};

// ── Helpers ───────────────────────────────────────────────────────────────
const fmt = (d: string) => {
  try { return format(new Date(d), "h:mm a", { locale: ar }); } catch { return ""; }
};

const fmtDate = (d: string) => {
  try { return format(new Date(d), "EEEE، d MMMM", { locale: ar }); } catch { return d; }
};

const fmtRelative = (d: string) => {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "الآن";
  if (mins < 60) return `${mins}د`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}س`;
  return format(new Date(d), "d/M", { locale: ar });
};

// ── Avatar ────────────────────────────────────────────────────────────────
function Avatar({ name, imageUrl, size = 36, isOwn = false }: {
  name?: string; imageUrl?: string; size?: number; isOwn?: boolean;
}) {
  const initials = name?.charAt(0)?.toUpperCase() || "?";
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name}
        style={{ width: size, height: size }}
        className="rounded-full object-cover border border-[#d0eaea] flex-shrink-0"
      />
    );
  }
  return (
    <div
      style={{ width: size, height: size, fontSize: size * 0.35 }}
      className={`rounded-full flex items-center justify-center font-bold flex-shrink-0 ${
        isOwn ? "bg-[#0d7377] text-white" : "bg-[#d5eaea] text-[#0d3d3d]"
      }`}
    >
      {initials}
    </div>
  );
}

// ── Message Status Icon ───────────────────────────────────────────────────
function MsgStatus({ message }: { message: Message }) {
  if (message.status === "sending") return <Loader2 size={10} className="animate-spin text-white/50" />;
  if (message.read || message.status === "read") return <CheckCheck size={11} style={{ color: "#7dd3d0" }} />;
  return <Check size={11} style={{ color: "#94b5b5" }} />;
}

// ── Message Bubble ────────────────────────────────────────────────────────
function Bubble({
  message, isOwn, showAvatar,
}: { message: Message; isOwn: boolean; showAvatar: boolean }) {
  const hasText = message.content?.trim() && message.content !== "🎤 رسالة صوتية";
  const hasFiles = !!message.files?.length;
  const offset = !showAvatar ? (isOwn ? "pr-8" : "pl-8") : "";

  return (
    <div className={`flex gap-2 mb-0.5 ${isOwn ? "flex-row-reverse" : "flex-row"} ${offset}`}>
      {showAvatar && (
        <div className="self-end flex-shrink-0">
          <Avatar
            name={message.sender?.name}
            imageUrl={message.sender?.imageUrl}
            size={24}
            isOwn={isOwn}
          />
        </div>
      )}

      <div className={`flex flex-col max-w-[68%] ${isOwn ? "items-end" : "items-start"}`}>
        {hasFiles && (
          <div className={`flex flex-col gap-1.5 mb-1 ${isOwn ? "items-end" : "items-start"}`}>
            {message.files?.map((file, i) => (
              <div key={i} className="text-[11px] text-[#8ab5b5] bg-[#f0fafa] border border-[#d5eaea] rounded-xl px-3 py-2 flex items-center gap-2">
                <FileText size={13} className="text-[#0d7377]" />
                <span className="truncate max-w-[180px]">{file.name}</span>
                {file.url && (
                  <a href={file.url} download={file.name} className="ml-1 text-[#0d7377]">
                    ↓
                  </a>
                )}
              </div>
            ))}
          </div>
        )}

        {hasText && (
          <div
            className={`px-3 py-2 text-[12px] leading-relaxed ${
              isOwn
                ? "bg-[#0d7377] text-white rounded-2xl rounded-tr-sm"
                : "bg-white text-[#1a3d3d] rounded-2xl rounded-tl-sm border border-[#e0eaea] shadow-sm"
            }`}
          >
            {message.content}
          </div>
        )}

        <div className={`flex items-center gap-1 mt-0.5 ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
          <span className="text-[9px]" style={{ color: T.textMuted }}>{fmt(message.createdAt)}</span>
          {isOwn && <MsgStatus message={message} />}
          {message.isTemp && <span className="text-[9px]" style={{ color: T.textMuted }}>جارٍ الإرسال...</span>}
        </div>
      </div>
    </div>
  );
}

// ── Typing Indicator ──────────────────────────────────────────────────────
function TypingIndicator({ name }: { name: string }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setStep((p) => (p + 1) % 4), 420);
    return () => clearInterval(iv);
  }, []);
  return (
    <div className="flex items-end gap-2 mb-2">
      <Avatar name={name} size={24} />
      <div className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-[#e0eaea] rounded-2xl rounded-tl-sm shadow-sm">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full transition-all duration-200"
            style={{
              background: T.primary,
              opacity: i < step ? 1 : 0.25,
              transform: i < step ? "scale(1)" : "scale(0.7)",
            }}
          />
        ))}
        <span className="text-[9px] mr-1" style={{ color: T.textMuted }}>{name} يكتب...</span>
      </div>
    </div>
  );
}

// ── Conversation List Item ────────────────────────────────────────────────
function ConvItem({ conv, isActive, onClick }: {
  conv: Conversation; isActive: boolean; onClick: () => void;
}) {
  const doc = conv.doctor;
  return (
    <button
      onClick={onClick}
      className={`w-full text-right transition-all duration-150 ${
        isActive ? "bg-white border-r-2 border-[#0d7377]" : "hover:bg-white/60"
      }`}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Avatar + online */}
        <div className="relative flex-shrink-0">
          <Avatar name={doc.name} imageUrl={doc.imageUrl} size={38} />
          <span
            className="absolute -bottom-0.5 -left-0.5 w-2.5 h-2.5 rounded-full border-2 border-white"
            style={{ background: doc.isOnline ? T.online : T.offline }}
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span
              className="text-[12px] font-semibold truncate"
              style={{ color: isActive ? T.primary : T.text }}
            >
              {doc.name}
            </span>
            <span className="text-[9px] flex-shrink-0 mr-1" style={{ color: T.textMuted }}>
              {conv.lastMessageTime ? fmtRelative(conv.lastMessageTime) : ""}
            </span>
          </div>
          <div className="flex items-center justify-between mt-0.5">
            <span className="text-[10px] truncate" style={{ color: T.textLight }}>
              {conv.lastMessage || "ابدأ المحادثة"}
            </span>
            {conv.unreadCount > 0 && (
              <span
                className="text-[9px] text-white rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 flex-shrink-0 ml-1"
                style={{ background: T.unread }}
              >
                {conv.unreadCount}
              </span>
            )}
          </div>
          <span className="text-[9px]" style={{ color: T.primary }}>{doc.specialty}</span>
        </div>
      </div>
    </button>
  );
}

// ── Chat Input Area ───────────────────────────────────────────────────────
function ChatInputArea({
  onSend, isSending,
}: {
  onSend: (text: string, files: File[]) => void;
  isSending: boolean;
}) {
  const [input, setInput] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const { theme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const canSend = input.trim().length > 0;

  const handleSend = () => {
    if (!canSend || isSending) return;
    onSend(input.trim(), []);
    setInput("");
    setShowEmoji(false);
    inputRef.current?.focus();
  };

  return (
    <div className="bg-white border-t flex-shrink-0" style={{ borderColor: T.border }}>
      {/* Quick chips */}
      <div className="flex gap-2 px-4 pt-2.5 pb-1.5">
        {[
          { Icon: Image, label: "صورة" },
          { Icon: FileText, label: "ملف طبي" },
          { Icon: Paperclip, label: "مرفق" },
        ].map(({ Icon, label }) => (
          <button
            key={label}
            onClick={() => fileInputRef.current?.click()}
            disabled={isSending}
            className="flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full border transition-colors disabled:opacity-40"
            style={{
              color: T.primary,
              background: T.primaryLight,
              borderColor: T.primaryBorder,
            }}
          >
            <Icon size={11} />
            {label}
          </button>
        ))}
      </div>

      {/* Input row */}
      <div className="flex items-center gap-2 px-4 pb-3">
        {/* Emoji */}
        <div className="relative">
          <button
            onClick={() => setShowEmoji(!showEmoji)}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style={{ color: showEmoji ? T.primary : T.textLight }}
          >
            <Smile size={18} />
          </button>
          {showEmoji && (
            <div className="absolute bottom-full right-0 mb-1 z-50">
              <div className="relative">
                <EmojiPicker
                  onEmojiClick={(e) => { setInput((p) => p + e.emoji); inputRef.current?.focus(); }}
                  theme={theme === "dark" ? Theme.DARK : Theme.LIGHT}
                  width={280} height={320} lazyLoadEmojis searchPlaceholder="بحث..."
                />
                <button
                  onClick={() => setShowEmoji(false)}
                  className="absolute -top-2 -left-2 w-5 h-5 rounded-full bg-white border flex items-center justify-center shadow-sm"
                  style={{ borderColor: T.border }}
                >
                  <X size={10} style={{ color: T.textLight }} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Text */}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder="اكتب رسالتك هنا..."
          disabled={isSending}
          className="flex-1 px-4 py-2 rounded-2xl text-[12px] border outline-none transition-all disabled:opacity-50"
          style={{
            background: T.bg,
            borderColor: T.border,
            color: T.text,
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = T.primary + "60")}
          onBlur={(e) => (e.currentTarget.style.borderColor = T.border)}
        />

        {/* Voice */}
        <button
          disabled={isSending}
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors disabled:opacity-40"
          style={{ color: T.textLight }}
        >
          <Mic size={18} />
        </button>

        {/* Send */}
        <button
          onClick={handleSend}
          disabled={!canSend || isSending}
          className="w-9 h-9 rounded-full flex items-center justify-center transition-all flex-shrink-0"
          style={{
            background: canSend && !isSending ? T.primary : "#e8f4f4",
            color: canSend && !isSending ? "#fff" : T.textMuted,
            cursor: canSend && !isSending ? "pointer" : "not-allowed",
          }}
        >
          {isSending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
        </button>
      </div>

      <input ref={fileInputRef} type="file" multiple className="hidden"
        accept="image/*,audio/*,video/*,application/pdf,.doc,.docx,.xls,.xlsx,.csv" />
    </div>
  );
}

// ── Empty States ──────────────────────────────────────────────────────────
function EmptyChat() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 py-16" style={{ background: T.bg }}>
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: T.primaryLight }}>
        <MessageSquare size={24} style={{ color: T.primary }} />
      </div>
      <p className="text-[13px]" style={{ color: T.textLight }}>اختر محادثة للبدء</p>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────
export default function PatientChatLayout() {
  const [conversations, setConversations] = useState<Conversation[]>(MOCK_CONVERSATIONS);
  const [selectedConvId, setSelectedConvId] = useState<string | null>("conv-1");
  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES["conv-1"] || []);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const msgsRef = useRef<HTMLDivElement>(null);

  const selectedConv = conversations.find((c) => c.id === selectedConvId);

  // Load messages when conversation changes
  useEffect(() => {
    if (!selectedConvId) return;
    setMessages(MOCK_MESSAGES[selectedConvId] || []);
    setIsTyping(false);
  }, [selectedConvId]);

  // Auto scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Group messages by date
  const groupedMessages = messages.reduce((acc, msg) => {
    const key = format(new Date(msg.createdAt), "yyyy-MM-dd");
    if (!acc[key]) acc[key] = [];
    acc[key].push(msg);
    return acc;
  }, {} as Record<string, Message[]>);

  const filteredConvs = conversations.filter((c) =>
    !searchQuery || c.doctor.name.includes(searchQuery) || c.doctor.specialty.includes(searchQuery)
  );

  const handleSend = useCallback((text: string, files: File[]) => {
    if (!text && !files.length) return;
    const tempMsg: Message = {
      id: `temp-${Date.now()}`,
      content: text,
      senderId: CURRENT_USER_ID,
      createdAt: new Date().toISOString(),
      sender: { id: CURRENT_USER_ID, name: "أنت" },
      files: files.map((f) => ({ name: f.name, type: f.type, size: f.size })),
      status: "sending",
      isTemp: true,
    };
    setMessages((prev) => [...prev, tempMsg]);
    setIsSending(true);

    // Simulate send
    setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempMsg.id ? { ...m, status: "sent", isTemp: false } : m
        )
      );
      setConversations((prev) =>
        prev.map((c) =>
          c.id === selectedConvId
            ? { ...c, lastMessage: text, lastMessageTime: new Date().toISOString(), unreadCount: 0 }
            : c
        )
      );
      setIsSending(false);

      // Simulate doctor reply
      setTimeout(() => {
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          const reply: Message = {
            id: `reply-${Date.now()}`,
            content: "شكراً، سأراجع المعلومات وأرد عليك قريباً",
            senderId: selectedConv?.doctor.id || "doc",
            createdAt: new Date().toISOString(),
            sender: { id: selectedConv?.doctor.id || "doc", name: selectedConv?.doctor.name || "الطبيب" },
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
      }, 800);
    }, 600);
  }, [selectedConvId, selectedConv]);

  return (
    <div
      dir="rtl"
      className="w-full rounded-2xl overflow-hidden flex"
      style={{
        background: T.white,
        border: `1px solid ${T.border}`,
        boxShadow: "0 4px 24px rgba(13,115,119,0.07)",
        minHeight: "600px",
        maxHeight: "calc(100vh - 200px)",
        height: 640,
      }}
    >
      {/* ── Sidebar: Conversations List ── */}
      <aside
        className="w-72 flex-shrink-0 flex flex-col border-l hidden lg:flex"
        style={{ borderColor: T.border, background: T.bg }}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b bg-white flex-shrink-0" style={{ borderColor: T.border }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[13px] font-semibold flex items-center gap-2" style={{ color: T.text }}>
              <MessageSquare size={15} style={{ color: T.primary }} />
              المحادثات
            </h2>
            <span
              className="text-[10px] font-medium px-2 py-0.5 rounded-full"
              style={{ background: T.primaryLight, color: T.primary }}
            >
              {conversations.length}
            </span>
          </div>
          <div className="relative">
            <Search size={13} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: T.textMuted }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث..."
              className="w-full pr-9 pl-3 py-2 rounded-xl text-[11px] outline-none transition-all"
              style={{
                background: T.primaryLight,
                border: `1px solid ${T.border}`,
                color: T.text,
              }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute left-3 top-1/2 -translate-y-1/2">
                <X size={12} style={{ color: T.textMuted }} />
              </button>
            )}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConvs.map((conv) => (
            <ConvItem
              key={conv.id}
              conv={conv}
              isActive={conv.id === selectedConvId}
              onClick={() => setSelectedConvId(conv.id)}
            />
          ))}
        </div>
      </aside>

      {/* ── Main Chat ── */}
      <main className="flex-1 flex flex-col min-w-0 bg-white">
        {!selectedConv ? (
          <EmptyChat />
        ) : (
          <>
            {/* Chat Header */}
            <div
              className="px-4 py-2.5 flex items-center justify-between border-b flex-shrink-0 bg-white"
              style={{ borderColor: T.border }}
            >
              <div className="flex items-center gap-3">
                <div className="relative flex-shrink-0">
                  <Avatar name={selectedConv.doctor.name} imageUrl={selectedConv.doctor.imageUrl} size={36} />
                  <span
                    className="absolute -bottom-0.5 -left-0.5 w-2.5 h-2.5 rounded-full border-2 border-white"
                    style={{ background: selectedConv.doctor.isOnline ? T.online : T.offline }}
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold" style={{ color: T.text }}>
                      {selectedConv.doctor.name}
                    </span>
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full border flex items-center gap-1"
                      style={{ background: T.primaryLight, color: T.primary, borderColor: T.primaryBorder }}
                    >
                      <Stethoscope size={9} />
                      {selectedConv.doctor.specialty}
                    </span>
                  </div>
                  <p className="text-[11px] mt-0.5 flex items-center gap-1.5" style={{ color: T.online }}>
                    <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: T.online }} />
                    {selectedConv.doctor.isOnline ? "متصل الآن" : "غير متصل"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-0.5">
                {[Phone, Video, MoreVertical].map((Icon, i) => (
                  <button
                    key={i}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                    style={{ color: T.textLight }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = T.primaryLight)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <Icon size={17} />
                  </button>
                ))}
              </div>
            </div>

            {/* Messages */}
            <div
              ref={msgsRef}
              className="flex-1 overflow-y-auto px-4 py-4"
              style={{ background: T.bg }}
            >
              {Object.entries(groupedMessages).map(([date, dateMessages]) => (
                <div key={date}>
                  <div className="flex items-center justify-center my-4">
                    <div
                      className="px-4 py-1 rounded-full text-[10px]"
                      style={{
                        background: T.white,
                        color: T.textMuted,
                        border: `1px solid ${T.border}`,
                      }}
                    >
                      {fmtDate(date)}
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    {dateMessages.map((msg, idx) => {
                      const isOwn = msg.senderId === CURRENT_USER_ID;
                      const prev = idx > 0 ? dateMessages[idx - 1] : null;
                      const showAvatar = !prev || prev.senderId !== msg.senderId;
                      return (
                        <Bubble key={msg.id} message={msg} isOwn={isOwn} showAvatar={showAvatar} />
                      );
                    })}
                  </div>
                </div>
              ))}

              {isTyping && <TypingIndicator name={selectedConv.doctor.name} />}

              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full gap-3">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center"
                    style={{ background: T.primaryLight }}
                  >
                    <MessageSquare size={22} style={{ color: T.primary }} />
                  </div>
                  <p className="text-[12px]" style={{ color: T.textLight }}>ابدأ المحادثة مع الطبيب</p>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <ChatInputArea onSend={handleSend} isSending={isSending} />
          </>
        )}
      </main>
    </div>
  );
}