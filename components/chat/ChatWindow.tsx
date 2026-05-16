"use client";

import { useEffect, useRef, useState, useTransition, useCallback } from "react";
import { sendMessage, getMessages, markMessagesAsRead, uploadFile, getMyConversations, getOrCreateConversation, searchDoctors } from "@/actions/chat";
import { format, formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { toast } from "sonner";
import { Search, XCircle, UserPlus, MessageCircle, Loader2 } from "lucide-react";
import MessageBubble from "./MessageBubble";
import ChatHeader from "./ChatHeader";
import ChatInput from "./ChatInput";
import TypingIndicator from "./TypingIndicator";
import type { ChatMessage, ChatUser, Conversation } from "@/lib/chat-types";

interface ChatWindowProps {
  conversationId: string;
  initialMessages: ChatMessage[];
  currentUserId: string;
  otherPerson: ChatUser;
  conversations: Conversation[];
}

export default function ChatWindow({
  conversationId,
  initialMessages,
  currentUserId,
  otherPerson: initialOtherPerson,
  conversations: initialConversations,
}: ChatWindowProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
  const [isPending, startTransition] = useTransition();
  const [isTyping, setIsTyping] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<ChatUser[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [otherPerson] = useState<ChatUser>(initialOtherPerson);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Polling for new messages (every 3 seconds)
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const data = await getMessages(conversationId);
        setMessages((prev) => {
          // Only update if there are new messages
          if (data.messages.length !== prev.length) {
            return data.messages;
          }
          // Update read status and file URLs
          return prev.map((msg, idx) => {
            const newMsg = data.messages[idx];
            if (newMsg && newMsg.id === msg.id) {
              // Update file URLs if they were empty
              const updatedFiles = msg.files?.map((f, fIdx) => {
                const newFile = newMsg.files?.[fIdx];
                if (newFile && (!f.url || f.url === "")) {
                  return { ...f, url: newFile.url };
                }
                return f;
              });
              return { 
                ...msg, 
                read: newMsg.read, 
                status: "read" as const,
                files: updatedFiles || msg.files
              };
            }
            return msg;
          });
        });
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [conversationId]);

  // Mark messages as read
  useEffect(() => {
    const markRead = async () => {
      const hasUnread = messages.some(
        (m) => m.senderId !== currentUserId && !m.read
      );
      if (hasUnread) {
        await markMessagesAsRead(conversationId);
        setMessages((prev) =>
          prev.map((m) =>
            m.senderId !== currentUserId ? { ...m, read: true, status: "read" as const } : m
          )
        );
      }
    };
    markRead();
  }, [messages, conversationId, currentUserId]);

  // Load conversations
  const loadConversations = useCallback(async () => {
    try {
      const { conversations: convos } = await getMyConversations();
      setConversations(convos);
    } catch (err) {
      console.error("Error loading conversations:", err);
    }
  }, []);

  // Search doctors
  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    if (term.length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }
    try {
      const results = await searchDoctors(term);
      setSearchResults(results);
      setShowSearchResults(true);
    } catch (err) {
      console.error("Search error:", err);
    }
  };

  // Start new conversation
  const startNewConversation = async (doctor: ChatUser) => {
    try {
      const { conversation } = await getOrCreateConversation(doctor.id);
      window.location.href = `/chat/${conversation.id}`;
    } catch (err) {
      toast.error("فشل بدء المحادثة");
    }
  };

  // Handle send message
  const handleSend = async (text: string, fileList: File[]) => {
    if ((!text.trim() && fileList.length === 0) || isPending) return;

    const tempId = `temp-${Date.now()}`;

    // Create optimistic message with empty URLs
    const optimisticMsg: ChatMessage = {
      id: tempId,
      content: text.trim(),
      senderId: currentUserId,
      createdAt: new Date().toISOString(),
      sender: { id: currentUserId, name: "أنت" },
      files: fileList.map((f) => ({ name: f.name, type: f.type, url: "", size: f.size })),
      status: "sending",
      read: false,
      isTemp: true,
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    const sentText = text.trim();

    startTransition(async () => {
      try {
        let uploadedFiles: { name: string; type: string; size: number; url: string }[] = [];

        // Upload files first
        if (fileList.length > 0) {
          const formData = new FormData();
          fileList.forEach((f) => formData.append("files", f));
          const uploadResult = await uploadFile(formData);
          uploadedFiles = uploadResult.files;
          console.log("Uploaded files:", uploadedFiles);
        }

        // Send message with uploaded file URLs
        const data = await sendMessage(conversationId, sentText, uploadedFiles);
        console.log("Server response:", data);

        // Replace optimistic message with real one including file URLs
        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempId
              ? { 
                  ...data.message, 
                  status: "sent" as const, 
                  isTemp: false,
                  files: data.message.files || uploadedFiles
                }
              : m
          )
        );

        await markMessagesAsRead(conversationId);
        loadConversations();
      } catch (err) {
        console.error("Send error:", err);
        toast.error("فشل إرسال الرسالة");
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
      }
    });
  };

  // Handle voice message
  const handleSendVoice = async (blob: Blob, duration: number) => {
    const tempId = `temp-voice-${Date.now()}`;
    const audioFile = new File([blob], `voice-${Date.now()}.webm`, { type: "audio/webm" });

    const optimisticMsg: ChatMessage = {
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

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("files", audioFile);
        const uploadResult = await uploadFile(formData);

        const data = await sendMessage(conversationId, "🎤 رسالة صوتية", uploadResult.files);

        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempId
              ? { 
                  ...data.message, 
                  status: "sent" as const, 
                  isTemp: false,
                  files: data.message.files || uploadResult.files
                }
              : m
          )
        );

        await markMessagesAsRead(conversationId);
        loadConversations();
      } catch (err) {
        console.error("Voice send error:", err);
        toast.error("فشل إرسال الرسالة الصوتية");
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
      }
    });
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = format(new Date(message.createdAt), "yyyy-MM-dd");
    if (!groups[date]) groups[date] = [];
    groups[date].push(message);
    return groups;
  }, {} as Record<string, ChatMessage[]>);

  return (
    <div className="flex h-screen w-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Conversations Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-80 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 flex flex-col transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              المحادثات
            </h2>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <XCircle size={18} className="text-slate-500" />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="البحث عن طبيب..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => handleSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <XCircle size={14} className="text-slate-400 hover:text-slate-600" />
              </button>
            )}
          </div>

          {/* Search Results */}
          {showSearchResults && searchResults.length > 0 && (
            <div className="absolute top-full left-4 right-4 mt-2 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden z-50">
              {searchResults.map((doctor) => (
                <button
                  key={doctor.id}
                  onClick={() => startNewConversation(doctor)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors border-b border-slate-100 dark:border-slate-700 last:border-0"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {doctor.name?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                      {doctor.name}
                    </p>
                    <p className="text-xs text-teal-600 dark:text-teal-400">
                      {doctor.specialty}
                    </p>
                  </div>
                  <UserPlus size={16} className="text-teal-500" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {conversations.map((conv) => {
            const isActive = conv.id === conversationId;
            const other =
              conv.patientId === currentUserId ? conv.doctor : conv.patient;
            const lastMsg =
              conv.lastMessage ||
              (conv.lastMessageHasFiles ? "📎 مرفق" : "لا توجد رسائل");

            return (
              <a
                key={conv.id}
                href={`/chat/${conv.id}`}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 p-3 border-b border-slate-100 dark:border-slate-700/50 transition-all ${
                  isActive
                    ? "bg-teal-50/80 dark:bg-teal-950/30 border-r-4 border-r-teal-500"
                    : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                }`}
              >
                <div className="relative flex-shrink-0">
                  {other?.imageUrl ? (
                    <img
                      src={other.imageUrl}
                      alt={other.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-slate-100 dark:border-slate-700"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-300 to-slate-400 dark:from-slate-600 dark:to-slate-700 flex items-center justify-center text-white font-bold text-lg">
                      {other?.name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                  )}
                  {conv.unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white dark:border-slate-900">
                      {conv.unreadCount}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <h3
                      className={`text-sm font-semibold truncate ${
                        isActive
                          ? "text-teal-700 dark:text-teal-300"
                          : "text-slate-800 dark:text-slate-100"
                      }`}
                    >
                      {other?.name || "محادثة"}
                    </h3>
                    {conv.lastMessageTime && (
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 flex-shrink-0">
                        {format(new Date(conv.lastMessageTime), "h:mm a")}
                      </span>
                    )}
                  </div>
                  {other?.specialty && (
                    <p className="text-[11px] text-teal-600 dark:text-teal-400 mb-0.5">
                      {other.specialty}
                    </p>
                  )}
                  <p
                    className={`text-xs truncate ${
                      conv.unreadCount > 0
                        ? "text-slate-800 dark:text-slate-200 font-medium"
                        : "text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    {lastMsg}
                  </p>
                </div>
              </a>
            );
          })}

          {conversations.length === 0 && (
            <div className="text-center py-12 px-4">
              <MessageCircle
                size={40}
                className="mx-auto text-slate-300 dark:text-slate-600 mb-3"
              />
              <p className="text-sm text-slate-500 dark:text-slate-400">
                لا توجد محادثات بعد
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                ابحث عن طبيب لبدء محادثة
              </p>
            </div>
          )}
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-900/50">
        {/* Chat Header */}
        <ChatHeader
          otherPerson={otherPerson}
          isOnline={true}
          showBackButton={true}
          onBack={() => setSidebarOpen(true)}
        />

        {/* Messages */}
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto px-4 py-4 space-y-1 scrollbar-thin"
        >
          {Object.entries(groupedMessages).map(([date, dateMessages]) => (
            <div key={date}>
              {/* Date Divider */}
              <div className="flex items-center justify-center my-4">
                <div className="bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 text-[11px] px-4 py-1 rounded-full font-medium">
                  {format(new Date(date), "EEEE, d MMMM yyyy", { locale: ar })}
                </div>
              </div>

              {/* Messages */}
              <div className="space-y-1">
                {dateMessages.map((msg, index) => {
                  const isOwn = msg.senderId === currentUserId;
                  const prevMsg = index > 0 ? dateMessages[index - 1] : null;
                  const showAvatar =
                    !prevMsg || prevMsg.senderId !== msg.senderId;

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

          {/* Typing Indicator */}
          {isTyping && (
            <TypingIndicator name={otherPerson.name || "الطرف الآخر"} />
          )}

          {/* Empty State */}
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full py-20">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-100 to-cyan-100 dark:from-teal-900/30 dark:to-cyan-900/30 flex items-center justify-center mb-4">
                <MessageCircle
                  size={36}
                  className="text-teal-500 dark:text-teal-400"
                />
              </div>
              <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-1">
                لا توجد رسائل بعد
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center max-w-xs">
                ابدأ محادثة بإرسال رسالة أو مرفق أدناه
              </p>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <ChatInput
          onSend={handleSend}
          onSendVoice={handleSendVoice}
          isSending={isPending}
          placeholder="اكتب رسالتك هنا..."
        />
      </main>
    </div>
  );
}