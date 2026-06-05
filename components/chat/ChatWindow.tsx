"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { toast } from "sonner";
import {
  MessageCircle, Loader2, Phone, Video, MoreVertical, ArrowRight,
  Stethoscope, Send, Check, CheckCheck, CheckCircle, Search, X
} from "lucide-react";
import MessageBubble from "./MessageBubble";
import ChatInput from "./ChatInput";
import TypingIndicator from "./TypingIndicator";
import { formatDistanceToNow } from "date-fns";

export default function ChatWindow({
  conversationId,
  initialMessages,
  currentUserId,
  currentUserRole,
  otherPerson: initialOtherPerson,
  conversations: initialConversations,
}) {
  const [messages, setMessages] = useState(initialMessages || []);
  const [conversations, setConversations] = useState(initialConversations || []);
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [otherPerson] = useState(initialOtherPerson);
  const [authError, setAuthError] = useState(false);
  const [videoRequested, setVideoRequested] = useState(false);
  // view: "list" | "chat"
  const [view, setView] = useState("chat");

  const isPatient = currentUserRole === "PATIENT";
  const isDoctor = currentUserRole === "DOCTOR";

  const bottomRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const prevConversationId = useRef(conversationId);
  const prevMessagesLength = useRef(0);

  // ── Scroll ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container || !bottomRef.current) return;
    const isNewConversation = prevConversationId.current !== conversationId;
    const isNewMessage = messages.length > prevMessagesLength.current;
    const lastMessage = messages[messages.length - 1];
    const isFromMe = lastMessage?.senderId === currentUserId;

    if (isNewConversation) {
      bottomRef.current.scrollIntoView({ behavior: "auto" });
      prevConversationId.current = conversationId;
    } else if (isNewMessage) {
      if (isFromMe) {
        bottomRef.current.scrollIntoView({ behavior: "smooth" });
      } else {
        const { scrollTop, scrollHeight, clientHeight } = container;
        if (scrollHeight - scrollTop - clientHeight < 150)
          bottomRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }
    prevMessagesLength.current = messages.length;
  }, [messages, conversationId, currentUserId]);

  // ── API helper ─────────────────────────────────────────────────────────────
  const apiCall = async (url, options = {}) => {
    const res = await fetch(url, { ...options, credentials: "include" });
    if (res.status === 401) { setAuthError(true); throw new Error("Unauthorized"); }
    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(error.error || `HTTP ${res.status}`);
    }
    return res.json();
  };

  // ── Polling messages ───────────────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const data = await apiCall(`/api/chat?conversationId=${conversationId}`);
        setAuthError(false);
        setMessages((prev) => {
          if (data.messages.length !== prev.length) return data.messages;
          return prev.map((msg, idx) => {
            const newMsg = data.messages[idx];
            if (newMsg && newMsg.id === msg.id) {
              const updatedFiles = msg.files?.map((f, fIdx) => {
                const newFile = newMsg.files?.[fIdx];
                return newFile && (!f.url || f.url === "") ? { ...f, url: newFile.url } : f;
              });
              return { ...msg, read: newMsg.read, status: "read", files: updatedFiles || msg.files };
            }
            return msg;
          });
        });
      } catch (err) {
        if (!err.message?.includes("Unauthorized")) console.error("Polling error:", err);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [conversationId]);

  // ── Mark read ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const markRead = async () => {
      const hasUnread = messages.some((m) => m.senderId !== currentUserId && !m.read);
      if (!hasUnread) return;
      try {
        await apiCall("/api/chat", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationId }),
        });
        setMessages((prev) => prev.map((m) => m.senderId !== currentUserId ? { ...m, read: true, status: "read" } : m));
      } catch (err) { console.error("Mark read error:", err); }
    };
    markRead();
  }, [messages, conversationId, currentUserId]);

  // ── Load conversations ─────────────────────────────────────────────────────
  const loadConversations = useCallback(async () => {
    try {
      const data = await apiCall("/api/chat");
      setConversations(data.conversations);
    } catch (err) { console.error("Error loading conversations:", err); }
  }, []);

  // ── Video / Phone ──────────────────────────────────────────────────────────
  const handleVideoRequest = async () => {
    if (isPatient) {
      try {
        await fetch("/api/notifications/video-request", {
          method: "POST", headers: { "Content-Type": "application/json" },
          credentials: "include", body: JSON.stringify({ conversationId }),
        });
        setVideoRequested(true);
        toast.success("✅ تم إرسال طلب مكالمة الفيديو للطبيب");
        setTimeout(() => setVideoRequested(false), 10000);
      } catch { toast.error("فشل إرسال الطلب"); }
    } else if (isDoctor) {
      toast.info("بدء مكالمة الفيديو...");
    }
  };

  const handlePhoneCall = async () => {
    if (!isDoctor) return;
    try {
      await fetch("/api/notifications/phone-request", {
        method: "POST", headers: { "Content-Type": "application/json" },
        credentials: "include", body: JSON.stringify({ conversationId }),
      });
      toast.success("✅ تم إرسال إشعار المكالمة للمريض");
    } catch { toast.error("فشل إرسال الإشعار"); }
  };

  // ── Send message ───────────────────────────────────────────────────────────
  const handleSend = async (text, fileList) => {
    if ((!text.trim() && (!fileList || fileList.length === 0)) || isSending) return;
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg = {
      id: tempId, content: text.trim(), senderId: currentUserId,
      createdAt: new Date().toISOString(), sender: { id: currentUserId, name: "أنت" },
      files: fileList?.map((f) => ({ name: f.name, type: f.type, url: "", size: f.size })) || [],
      status: "sending", read: false, isTemp: true,
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    setIsSending(true);
    try {
      let uploadedFiles = [];
      if (fileList && fileList.length > 0) {
        const formData = new FormData();
        fileList.forEach((f) => formData.append("files", f));
        const uploadRes = await fetch("/api/chat", { method: "POST", credentials: "include", body: formData });
        if (!uploadRes.ok) { if (uploadRes.status === 401) { setAuthError(true); throw new Error("Unauthorized"); } throw new Error("Upload failed"); }
        const uploadData = await uploadRes.json();
        uploadedFiles = uploadData.files || [];
      }
      const messageRes = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ conversationId, content: text.trim(), files: uploadedFiles }),
      });
      if (!messageRes.ok) { if (messageRes.status === 401) { setAuthError(true); throw new Error("Unauthorized"); } throw new Error("Send failed"); }
      const data = await messageRes.json();
      setAuthError(false);
      setMessages((prev) => prev.map((m) => m.id === tempId ? { ...data.message, status: "sent", isTemp: false, files: data.message.files || uploadedFiles } : m));
      await apiCall("/api/chat", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ conversationId }) });
      loadConversations();
    } catch (err) {
      if (err.message?.includes("Unauthorized")) toast.error("انتهت الجلسة - يرجى تسجيل الدخول");
      else toast.error("فشل إرسال الرسالة");
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } finally { setIsSending(false); }
  };

  // ── Send voice ─────────────────────────────────────────────────────────────
  const handleSendVoice = async (blob) => {
    const tempId = `temp-voice-${Date.now()}`;
    const audioFile = new File([blob], `voice-${Date.now()}.webm`, { type: "audio/webm" });
    const optimisticMsg = {
      id: tempId, content: "🎤 رسالة صوتية", senderId: currentUserId,
      createdAt: new Date().toISOString(), sender: { id: currentUserId, name: "أنت" },
      files: [{ name: audioFile.name, type: audioFile.type, url: "", size: audioFile.size }],
      status: "sending", read: false, isTemp: true,
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    setIsSending(true);
    try {
      const formData = new FormData();
      formData.append("files", audioFile);
      const uploadRes = await fetch("/api/chat", { method: "POST", credentials: "include", body: formData });
      if (!uploadRes.ok) { if (uploadRes.status === 401) { setAuthError(true); throw new Error("Unauthorized"); } throw new Error("Upload failed"); }
      const uploadData = await uploadRes.json();
      const messageRes = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ conversationId, content: "🎤 رسالة صوتية", files: uploadData.files }),
      });
      if (!messageRes.ok) { if (messageRes.status === 401) { setAuthError(true); throw new Error("Unauthorized"); } throw new Error("Send failed"); }
      const data = await messageRes.json();
      setAuthError(false);
      setMessages((prev) => prev.map((m) => m.id === tempId ? { ...data.message, status: "sent", isTemp: false, files: data.message.files || uploadData.files } : m));
      await apiCall("/api/chat", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ conversationId }) });
      loadConversations();
    } catch (err) {
      if (err.message?.includes("Unauthorized")) toast.error("انتهت الجلسة - يرجى تسجيل الدخول");
      else toast.error("فشل إرسال الرسالة الصوتية");
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } finally { setIsSending(false); }
  };

  const groupedMessages = messages.reduce((groups, message) => {
    const date = format(new Date(message.createdAt), "yyyy-MM-dd");
    if (!groups[date]) groups[date] = [];
    groups[date].push(message);
    return groups;
  }, {});

  const totalUnread = conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);

  // ── Auth error ─────────────────────────────────────────────────────────────
  if (authError) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#f0f7f7]">
        <div className="text-center p-8">
          <h3 className="text-lg font-bold text-[#0d5c5c] mb-2">انتهت الجلسة</h3>
          <p className="text-sm text-[#6b9e9e] mb-4">يرجى تسجيل الدخول مرة أخرى</p>
          <button onClick={() => window.location.href = "/sign-in"} className="bg-[#0d7377] text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-[#0a5c5f] transition-colors">تسجيل الدخول</button>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // VIEW: LIST
  // ══════════════════════════════════════════════════════════════════════════
  if (view === "list") {
    return (
      <div className="flex flex-col h-full bg-white" dir="rtl">
        {/* Header */}
        <div className="px-4 py-3 border-b border-[#e8f0f0] flex items-center justify-between">
          <h1 className="text-base font-bold text-[#0d5c5c]">المحادثات</h1>
          {totalUnread > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              {totalUnread} جديد
            </span>
          )}
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#f5fafa]">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-20 px-4 text-center">
              <div className="w-16 h-16 rounded-full bg-[#f5fafa] flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-[#d0e8e8]" />
              </div>
              <p className="text-sm text-[#6b9e9e]">لا توجد محادثات بعد</p>
            </div>
          ) : (
            conversations.map((conv) => {
              const otherP = currentUserId === conv.patientId ? conv.doctor : conv.patient;
              const unread = conv.unreadCount || 0;
              const isActive = conv.id === conversationId;

              return (
                <button
                  key={conv.id}
                  onClick={() => {
                    window.location.href = `/chat/${conv.id}`;
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-right transition-all hover:bg-[#f9fdfd] ${isActive ? "bg-[#edf7f5]" : ""}`}
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    {otherP?.imageUrl ? (
                      <img src={otherP.imageUrl} alt={otherP.name} className="w-11 h-11 rounded-full object-cover border border-[#d0e8e8]" />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-[#0d7377] flex items-center justify-center text-white font-bold text-base">
                        {otherP?.name?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                    )}
                    <div className="absolute -bottom-0.5 -left-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-white" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className={`text-sm font-semibold truncate ${unread > 0 ? "text-[#0d5c5c]" : "text-[#0d5c5c]/80"}`}>
                        {otherP?.name || "مجهول"}
                      </span>
                      {conv.lastMessageTime && (
                        <span className="text-[10px] text-[#8ab5b5] flex-shrink-0 mr-1">
                          {formatDistanceToNow(new Date(conv.lastMessageTime), { addSuffix: true, locale: ar })}
                        </span>
                      )}
                    </div>
                    {otherP?.specialty && (
                      <p className="text-[11px] text-[#0d7377] flex items-center gap-1 mb-0.5">
                        <Stethoscope className="w-3 h-3" />
                        {otherP.specialty}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <p className={`text-xs truncate flex-1 ${unread > 0 ? "text-[#0d5c5c] font-medium" : "text-[#8ab5b5]"}`}>
                        {conv.lastMessageHasFiles && !conv.lastMessage?.startsWith("📎")
                          ? `📎 ${conv.lastMessage || "ملف مرفق"}`
                          : (conv.lastMessage || "لا توجد رسائل بعد")}
                      </p>
                      {unread > 0 && (
                        <span className="flex-shrink-0 mr-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                          {unread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // VIEW: CHAT
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="flex flex-col h-full bg-white" dir="rtl">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="px-3 py-2 border-b border-[#EAEFF3] flex items-center justify-between bg-white">
        <div className="flex items-center gap-2">

          {/* زر الرجوع للقائمة */}
          <button
            onClick={() => setView("list")}
            className="p-1.5 rounded-xl hover:bg-[#F4F8F7] transition-colors flex items-center gap-1"
            aria-label="الرجوع للمحادثات"
          >
            <ArrowRight className="w-4 h-4 text-[#0d7377]" />
            {totalUnread > 0 && (
              <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                {totalUnread}
              </span>
            )}
          </button>

          {/* Avatar */}
          <div className="relative">
            {otherPerson?.imageUrl ? (
              <img src={otherPerson.imageUrl} alt={otherPerson.name} className="w-8 h-8 rounded-full object-cover border border-[#DCE7E7]" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#0F766E] flex items-center justify-center text-white font-semibold text-xs">
                {otherPerson?.name?.charAt(0)?.toUpperCase() || "?"}
              </div>
            )}
            <div className="absolute -bottom-0.5 -left-0.5 w-2 h-2 rounded-full bg-emerald-500 border border-white" />
          </div>

          {/* Info */}
          <div>
            <h3 className="text-[12px] font-semibold text-slate-900 leading-tight">
              {otherPerson?.name || "مجهول"}
            </h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              {otherPerson?.specialty && (
                <span className="text-[9px] text-[#0F766E] bg-[#EAF5F3] px-1.5 py-[2px] rounded-md">
                  {otherPerson.specialty}
                </span>
              )}
              <span className="text-[9px] text-emerald-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                متصل الآن
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {isDoctor && (
            <button onClick={handlePhoneCall} aria-label="مكالمة هاتفية"
              className="w-8 h-8 rounded-xl hover:bg-[#F4F8F7] transition-colors flex items-center justify-center">
              <Phone className="w-3.5 h-3.5 text-slate-500" />
            </button>
          )}
          <button onClick={handleVideoRequest}
            aria-label={isPatient ? "طلب مكالمة فيديو" : "بدء مكالمة فيديو"}
            className={`w-8 h-8 rounded-xl transition-colors flex items-center justify-center ${videoRequested ? "bg-emerald-50" : "hover:bg-[#F4F8F7]"}`}>
            {videoRequested
              ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
              : <Video className="w-3.5 h-3.5 text-slate-500" />}
          </button>
          <button aria-label="المزيد" className="w-8 h-8 rounded-xl hover:bg-[#F4F8F7] transition-colors flex items-center justify-center">
            <MoreVertical className="w-3.5 h-3.5 text-slate-500" />
          </button>
        </div>
      </div>

      {/* ── Messages ───────────────────────────────────────────────────────── */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-3 py-2 bg-[#F8FCFB]">
        {Object.entries(groupedMessages).map(([date, dateMessages]) => (
          <div key={date} className="mb-4">
            <div className="flex items-center justify-center my-3">
              <div className="bg-white border border-[#E2E8F0] text-slate-500 text-[10px] px-3 py-1 rounded-full font-medium">
                {format(new Date(date), "EEEE, d MMMM yyyy", { locale: ar })}
              </div>
            </div>
            <div className="space-y-[2px]">
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
                    senderName={msg.sender?.name}
                    senderImage={msg.sender?.imageUrl}
                  />
                );
              })}
            </div>
          </div>
        ))}

        {isTyping && <TypingIndicator name={otherPerson?.name || "الطرف الآخر"} />}

        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full py-16">
            <div className="w-14 h-14 rounded-2xl bg-[#EAF5F3] flex items-center justify-center mb-3">
              <MessageCircle className="w-6 h-6 text-[#0F766E]" />
            </div>
            <p className="text-[12px] text-slate-500">لا توجد رسائل بعد</p>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Input ──────────────────────────────────────────────────────────── */}
      <div className="border-t border-[#EAEFF3] bg-white px-3 py-2">
        <ChatInput onSend={handleSend} onSendVoice={handleSendVoice} isSending={isSending} />
      </div>
    </div>
  );
}