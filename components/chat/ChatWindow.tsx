"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { toast } from "sonner";
import {
  Search, XCircle, UserPlus, MessageCircle, Loader2,
  Phone, Video, MoreVertical, ArrowLeft, ChevronLeft,
  Stethoscope, Clock, Bell, Send, Paperclip, Mic, Smile,
  LayoutDashboard, Calendar, Archive, HelpCircle, LogOut,
  FileText, Image, Music, Check, CheckCheck, CheckCircle
} from "lucide-react";
import MessageBubble from "./MessageBubble";
import ChatInput from "./ChatInput";
import TypingIndicator from "./TypingIndicator";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [otherPerson] = useState(initialOtherPerson);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [authError, setAuthError] = useState(false);
  const [videoRequested, setVideoRequested] = useState(false);

  const isPatient = currentUserRole === "PATIENT";
  const isDoctor = currentUserRole === "DOCTOR";

  const handleVideoRequest = async () => {
    if (isPatient) {
      try {
        await fetch("/api/notifications/video-request", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ conversationId }),
        });
        setVideoRequested(true);
        toast.success("✅ تم إرسال طلب مكالمة الفيديو للطبيب");
        setTimeout(() => setVideoRequested(false), 10000);
      } catch {
        toast.error("فشل إرسال الطلب");
      }
    } else if (isDoctor) {
      toast.info("بدء مكالمة الفيديو...");
    }
  };

  const handlePhoneCall = async () => {
    if (!isDoctor) return;
    try {
      await fetch("/api/notifications/phone-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ conversationId }),
      });
      toast.success("✅ تم إرسال إشعار المكالمة للمريض");
    } catch {
      toast.error("فشل إرسال الإشعار");
    }
  };

  const bottomRef = useRef(null);
  const messagesContainerRef = useRef(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const prevConversationId = useRef(conversationId);
  const prevMessagesLength = useRef(0);
  const isFirstLoad = useRef(true);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container || !bottomRef.current) return;

    const isNewConversation = prevConversationId.current !== conversationId;
    const isNewMessage = messages.length > prevMessagesLength.current;
    const lastMessage = messages[messages.length - 1];
    const isFromMe = lastMessage?.senderId === currentUserId;

    if (isNewConversation) {
      // ✅ محادثة جديدة/قديمة: scroll للأسفل بدون animation
      bottomRef.current.scrollIntoView({ behavior: "auto" });
      prevConversationId.current = conversationId;
      isFirstLoad.current = false;
    } else if (isNewMessage) {
      // ✅ رسالة جديدة
      if (isFromMe) {
        // من المستخدم: scroll دائماً للأسفل
        bottomRef.current.scrollIntoView({ behavior: "smooth" });
      } else {
        // من الطرف الآخر: scroll فقط لو المستخدم قريب من الأسفل
        const { scrollTop, scrollHeight, clientHeight } = container;
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;
        if (isNearBottom) {
          bottomRef.current.scrollIntoView({ behavior: "smooth" });
        }
      }
    }

    prevMessagesLength.current = messages.length;
  }, [messages, conversationId, currentUserId]);

  const apiCall = async (url, options = {}) => {
    const res = await fetch(url, {
      ...options,
      credentials: "include",
    });
    if (res.status === 401) {
      setAuthError(true);
      throw new Error("Unauthorized");
    }
    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(error.error || `HTTP ${res.status}`);
    }
    return res.json();
  };

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
                if (newFile && (!f.url || f.url === "")) {
                  return { ...f, url: newFile.url };
                }
                return f;
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

  useEffect(() => {
    const markRead = async () => {
      const hasUnread = messages.some((m) => m.senderId !== currentUserId && !m.read);
      if (hasUnread) {
        try {
          await apiCall("/api/chat", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ conversationId }),
          });
          setAuthError(false);
          setMessages((prev) => prev.map((m) => m.senderId !== currentUserId ? { ...m, read: true, status: "read" } : m));
        } catch (err) {
          console.error("Mark read error:", err);
        }
      }
    };
    markRead();
  }, [messages, conversationId, currentUserId]);

  const loadConversations = useCallback(async () => {
    try {
      const data = await apiCall("/api/chat");
      setAuthError(false);
      setConversations(data.conversations);
    } catch (err) {
      console.error("Error loading conversations:", err);
    }
  }, []);

  const handleSearch = async (term) => {
    setSearchTerm(term);
    if (term.length < 2) { setSearchResults([]); setShowSearchResults(false); return; }
    try {
      const data = await apiCall(`/api/search-doctors?q=${encodeURIComponent(term)}`);
      setSearchResults(data);
      setShowSearchResults(true);
    } catch (err) {
      console.error("Search error:", err);
    }
  };

  const startNewConversation = async (doctor) => {
    try {
      const data = await apiCall("/api/chat/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doctorId: doctor.id }),
      });
      window.location.href = `/chat/${data.conversation.id}`;
    } catch (err) {
      if (err.message?.includes("Unauthorized")) toast.error("انتهت الجلسة - يرجى تسجيل الدخول");
      else toast.error("فشل بدء المحادثة");
    }
  };

  const handleSend = async (text, fileList) => {
    if ((!text.trim() && (!fileList || fileList.length === 0)) || isSending) return;
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg = {
      id: tempId,
      content: text.trim(),
      senderId: currentUserId,
      createdAt: new Date().toISOString(),
      sender: { id: currentUserId, name: "أنت" },
      files: fileList?.map((f) => ({ name: f.name, type: f.type, url: "", size: f.size })) || [],
      status: "sending",
      read: false,
      isTemp: true,
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    setIsSending(true);
    const sentText = text.trim();
    try {
      let uploadedFiles = [];
      if (fileList && fileList.length > 0) {
        const formData = new FormData();
        fileList.forEach((f) => formData.append("files", f));
        const uploadRes = await fetch("/api/chat", { method: "POST", credentials: "include", body: formData });
        if (!uploadRes.ok) {
          if (uploadRes.status === 401) { setAuthError(true); throw new Error("Unauthorized"); }
          throw new Error("Upload failed");
        }
        const uploadData = await uploadRes.json();
        uploadedFiles = uploadData.files || [];
      }
      const messageRes = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ conversationId, content: sentText, files: uploadedFiles }),
      });
      if (!messageRes.ok) {
        if (messageRes.status === 401) { setAuthError(true); throw new Error("Unauthorized"); }
        throw new Error("Send failed");
      }
      const data = await messageRes.json();
      setAuthError(false);
      setMessages((prev) => prev.map((m) => m.id === tempId ? { ...data.message, status: "sent", isTemp: false, files: data.message.files || uploadedFiles } : m));
      await apiCall("/api/chat", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ conversationId }) });
      loadConversations();
    } catch (err) {
      console.error("Send error:", err);
      if (err.message?.includes("Unauthorized")) toast.error("انتهت الجلسة - يرجى تسجيل الدخول");
      else toast.error("فشل إرسال الرسالة");
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } finally {
      setIsSending(false);
    }
  };

  const handleSendVoice = async (blob, duration) => {
    const tempId = `temp-voice-${Date.now()}`;
    const audioFile = new File([blob], `voice-${Date.now()}.webm`, { type: "audio/webm" });
    const optimisticMsg = {
      id: tempId,
      content: "🎤 رسالة صوتية",
      senderId: currentUserId,
      createdAt: new Date().toISOString(),
      sender: { id: currentUserId, name: "أنت" },
      files: [{ name: audioFile.name, type: audioFile.type, url: "", size: audioFile.size }],
      status: "sending",
      read: false,
      isTemp: true,
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    setIsSending(true);
    try {
      const formData = new FormData();
      formData.append("files", audioFile);
      const uploadRes = await fetch("/api/chat", { method: "POST", credentials: "include", body: formData });
      if (!uploadRes.ok) {
        if (uploadRes.status === 401) { setAuthError(true); throw new Error("Unauthorized"); }
        throw new Error("Upload failed");
      }
      const uploadData = await uploadRes.json();
      const messageRes = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ conversationId, content: "🎤 رسالة صوتية", files: uploadData.files }),
      });
      if (!messageRes.ok) {
        if (messageRes.status === 401) { setAuthError(true); throw new Error("Unauthorized"); }
        throw new Error("Send failed");
      }
      const data = await messageRes.json();
      setAuthError(false);
      setMessages((prev) => prev.map((m) => m.id === tempId ? { ...data.message, status: "sent", isTemp: false, files: data.message.files || uploadData.files } : m));
      await apiCall("/api/chat", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ conversationId }) });
      loadConversations();
    } catch (err) {
      console.error("Voice send error:", err);
      if (err.message?.includes("Unauthorized")) toast.error("انتهت الجلسة - يرجى تسجيل الدخول");
      else toast.error("فشل إرسال الرسالة الصوتية");
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } finally {
      setIsSending(false);
    }
  };

  const groupedMessages = messages.reduce((groups, message) => {
    const date = format(new Date(message.createdAt), "yyyy-MM-dd");
    if (!groups[date]) groups[date] = [];
    groups[date].push(message);
    return groups;
  }, {});

  const totalUnread = conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);

  if (authError) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#f0f7f7]">
        <div className="text-center p-8">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          </div>
          <h3 className="text-lg font-bold text-[#0d5c5c] mb-2">انتهت الجلسة</h3>
          <p className="text-sm text-[#6b9e9e] mb-4">يرجى تسجيل الدخول مرة أخرى</p>
          <button onClick={() => window.location.href = "/sign-in"} className="bg-[#0d7377] text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-[#0a5c5f] transition-colors">تسجيل الدخول</button>
        </div>
      </div>
    );
  }

 return (
  <div
    className="
      flex h-full w-full
      bg-[#F8FCFB]
      overflow-hidden
    "
    dir="rtl"
  >
     
       
      {/* ========== MIDDLE: Conversations List ========== */}
      <aside className={`w-72 bg-white border-l border-[#e0e8e8] flex flex-col ${isMobile ? (sidebarOpen ? "fixed inset-y-0 right-0 z-50" : "hidden") : ""}`}>
        {/* Mobile overlay */}
        {isMobile && sidebarOpen && (
          <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setSidebarOpen(false)} />
        )}

             </aside>

     {/* ===================== */}
{/* CHAT */}
{/* ===================== */}

<main className="flex-1 flex flex-col min-w-0 bg-white">
  {/* HEADER */}

  <div className="px-3 py-2 border-b border-[#EAEFF3] flex items-center justify-between">
    <div className="flex items-center gap-2">
      {isMobile && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="
            p-1.5
            rounded-xl
            hover:bg-[#F4F8F7]
            transition-colors
            lg:hidden
          "
        >
          <ArrowLeft className="w-4 h-4 text-slate-500" />
        </button>
      )}

      {/* AVATAR */}

      <div className="relative">
        {otherPerson?.imageUrl ? (
          <img
            src={otherPerson.imageUrl}
            alt={otherPerson.name}
            className="
              w-7 h-7
              rounded-full
              object-cover
              border border-[#DCE7E7]
            "
          />
        ) : (
          <div
            className="
              w-7 h-7
              rounded-full
              bg-[#0F766E]
              flex items-center justify-center
              text-white
              font-semibold
              text-[11px]
            "
          >
            {otherPerson?.name
              ?.charAt(0)
              ?.toUpperCase() || "?"}
          </div>
        )}

        <div
          className="
            absolute
            -bottom-0.5
            -left-0.5
            w-2 h-2
            rounded-full
            bg-emerald-500
            border border-white
          "
        />
      </div>

      {/* INFO */}

      <div>
        <h3 className="text-[11px] font-semibold text-slate-900">
          {otherPerson?.name || "مجهول"}
        </h3>

        <div className="flex items-center gap-1 mt-0.5">
          {otherPerson?.specialty && (
            <span
              className="
                text-[9px]
                text-[#0F766E]
                bg-[#EAF5F3]
                px-1.5 py-[2px]
                rounded-md
              "
            >
              {otherPerson.specialty}
            </span>
          )}

          <span className="text-[9px] text-emerald-500 flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-emerald-400" />
            متصل الآن
          </span>
        </div>
      </div>
    </div>

    {/* ACTIONS */}

    <div className="flex items-center gap-1">
      {/* زر الهاتف — للطبيب فقط */}
      {isDoctor && (
        <button
          onClick={handlePhoneCall}
          aria-label="مكالمة هاتفية"
          className="w-8 h-8 rounded-xl hover:bg-[#F4F8F7] transition-colors flex items-center justify-center"
          title="إرسال إشعار مكالمة هاتفية للمريض"
        >
          <Phone className="w-3.5 h-3.5 text-slate-500" />
        </button>
      )}

      {/* زر الفيديو — للجميع بسلوك مختلف */}
      <button
        onClick={handleVideoRequest}
        aria-label={isPatient ? "طلب مكالمة فيديو" : "بدء مكالمة فيديو"}
        title={isPatient ? (videoRequested ? "تم إرسال الطلب ✓" : "طلب مكالمة فيديو من الطبيب") : "بدء مكالمة فيديو"}
        className={`w-8 h-8 rounded-xl transition-colors flex items-center justify-center ${
          videoRequested ? "bg-emerald-50" : "hover:bg-[#F4F8F7]"
        }`}
      >
        {videoRequested
          ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
          : <Video className="w-3.5 h-3.5 text-slate-500" />
        }
      </button>

      <button
        aria-label="المزيد"
        className="w-8 h-8 rounded-xl hover:bg-[#F4F8F7] transition-colors flex items-center justify-center"
      >
        <MoreVertical className="w-3.5 h-3.5 text-slate-500" />
      </button>
    </div>
  </div>

  {/* MESSAGES */}

  <div
    ref={messagesContainerRef}
    className="
      flex-1
      overflow-y-auto
      px-3 py-2
      bg-[#F8FCFB]
    "
  >
    {Object.entries(groupedMessages).map(
      ([date, dateMessages]) => (
        <div key={date} className="mb-4">
          {/* DATE */}

          <div className="flex items-center justify-center my-3">
            <div
              className="
                bg-white
                border border-[#E2E8F0]
                text-slate-500
                text-[10px]
                px-3 py-1
                rounded-full
                font-medium
              "
            >
              {format(
                new Date(date),
                "EEEE, d MMMM yyyy",
                {
                  locale: ar,
                }
              )}
            </div>
          </div>

          {/* MESSAGE LIST */}

          <div className="space-y-[2px]">
            {dateMessages.map(
              (msg, index) => {
                const isOwn =
                  msg.senderId === currentUserId;

                const prevMsg =
                  index > 0
                    ? dateMessages[index - 1]
                    : null;

                const showAvatar =
                  !prevMsg ||
                  prevMsg.senderId !==
                    msg.senderId;

                return (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    isOwn={isOwn}
                    showAvatar={showAvatar}
                    senderName={msg.sender?.name}
                    senderImage={
                      msg.sender?.imageUrl
                    }
                  />
                );
              }
            )}
          </div>
        </div>
      )
    )}

    {isTyping && (
      <TypingIndicator
        name={
          otherPerson?.name ||
          "الطرف الآخر"
        }
      />
    )}

    {messages.length === 0 && (
      <div className="flex flex-col items-center justify-center h-full py-16">
        <div
          className="
            w-14 h-14
            rounded-2xl
            bg-[#EAF5F3]
            flex items-center justify-center
            mb-3
          "
        >
          <MessageCircle className="w-6 h-6 text-[#0F766E]" />
        </div>

        <p className="text-[12px] text-slate-500">
          لا توجد رسائل بعد
        </p>
      </div>
    )}

    <div ref={bottomRef} />
  </div>

  {/* INPUT */}

  <div className="border-t border-[#EAEFF3] bg-white px-3 py-2">
    <ChatInput
      onSend={handleSend}
      onSendVoice={handleSendVoice}
      isSending={isSending}
    />
  </div>
</main>
    </div>
  );
}