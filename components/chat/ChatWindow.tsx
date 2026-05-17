"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { toast } from "sonner";

import {
  Search,
  XCircle,
  UserPlus,
  MessageCircle,
  Loader2,
  Phone,
  Video,
  MoreVertical,
  ArrowLeft,
} from "lucide-react";

import MessageBubble from "./MessageBubble";
import ChatInput from "./ChatInput";
import TypingIndicator from "./TypingIndicator";

interface ChatWindowProps {
  conversationId?: string | null;
  initialMessages?: any[];
  currentUserId: string;
  otherPerson?: any;
  conversations?: any[];
}

export default function ChatWindow({
  conversationId,
  initialMessages = [],
  currentUserId,
  otherPerson: initialOtherPerson,
  conversations: initialConversations = [],
}: ChatWindowProps) {
  const [messages, setMessages] = useState<any[]>(initialMessages);

  const [conversations, setConversations] =
    useState<any[]>(initialConversations);

  const [isSending, setIsSending] = useState(false);

  const [isTyping] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");

  const [searchResults, setSearchResults] =
    useState<any[]>([]);

  const [showSearchResults, setShowSearchResults] =
    useState(false);

  const [otherPerson] = useState(initialOtherPerson);

  const [selectedDoctor, setSelectedDoctor] =
    useState<any>(null);

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  const [isMobile, setIsMobile] =
    useState(false);

  const [authError, setAuthError] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  // =========================
  // MOBILE
  // =========================

  useEffect(() => {
    const checkMobile = () =>
      setIsMobile(window.innerWidth < 1024);

    checkMobile();

    window.addEventListener("resize", checkMobile);

    return () =>
      window.removeEventListener(
        "resize",
        checkMobile
      );
  }, []);

  // =========================
  // SCROLL
  // =========================

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  // =========================
  // API CALL
  // =========================

  const apiCall = async (
    url: string,
    options = {}
  ) => {
    const res = await fetch(url, {
      ...options,
      credentials: "include",
    });

    if (res.status === 401) {
      setAuthError(true);

      throw new Error("Unauthorized");
    }

    if (!res.ok) {
      const error = await res
        .json()
        .catch(() => ({
          error: "Unknown error",
        }));

      throw new Error(
        error.error || `HTTP ${res.status}`
      );
    }

    return res.json();
  };

  // =========================
  // LOAD MESSAGES
  // =========================

  useEffect(() => {
    if (
      !conversationId ||
      conversationId === "undefined" ||
      conversationId === "null"
    ) {
      return;
    }

    const fetchMessages = async () => {
      try {
        const data = await apiCall(
          `/api/chat?conversationId=${conversationId}`
        );

        if (data?.messages) {
          setMessages(data.messages);
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchMessages();

    const interval = setInterval(
      fetchMessages,
      3000
    );

    return () => clearInterval(interval);
  }, [conversationId]);

  // =========================
  // LOAD CONVERSATIONS
  // =========================

  const loadConversations =
    useCallback(async () => {
      try {
        setLoading(true);

        const data = await apiCall("/api/chat");

        setConversations(
          data.conversations || []
        );
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // =========================
  // SEARCH DOCTORS
  // =========================

  const handleSearch = async (
    term: string
  ) => {
    setSearchTerm(term);

    if (term.length < 2) {
      setSearchResults([]);

      setShowSearchResults(false);

      return;
    }

    try {
      const data = await apiCall(
        `/api/search-doctors?q=${encodeURIComponent(
          term
        )}`
      );

      setSearchResults(data);

      setShowSearchResults(true);
    } catch (err) {
      console.error(err);
    }
  };

  // =========================
  // START CONVERSATION
  // =========================

  const startNewConversation = async (
    doctor: any
  ) => {
    try {
      setSelectedDoctor(doctor);

      const data = await apiCall(
        "/api/chat/conversations",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            doctorId: doctor.id,
          }),
        }
      );

      window.location.href = `/chat/${data.conversation.id}`;
    } catch (err: any) {
      if (
        err.message?.includes(
          "Unauthorized"
        )
      ) {
        toast.error("انتهت الجلسة");
      } else {
        toast.error(
          "فشل بدء المحادثة"
        );
      }
    }
  };

  // =========================
  // SEND MESSAGE
  // =========================

  const handleSend = async (
    text: string
  ) => {
    if (!text.trim()) return;

    try {
      setIsSending(true);

      const res = await fetch(
        "/api/chat",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          credentials: "include",

          body: JSON.stringify({
            conversationId,
            content: text,
          }),
        }
      );

      const data = await res.json();

      if (data.message) {
        setMessages((prev) => [
          ...prev,
          data.message,
        ]);
      }
    } catch (err) {
      console.error(err);

      toast.error(
        "فشل إرسال الرسالة"
      );
    } finally {
      setIsSending(false);
    }
  };

  // =========================
  // GROUP MESSAGES
  // =========================

  const groupedMessages =
    messages.reduce(
      (
        groups: any,
        message: any
      ) => {
        const date = format(
          new Date(message.createdAt),
          "yyyy-MM-dd"
        );

        if (!groups[date]) {
          groups[date] = [];
        }

        groups[date].push(message);

        return groups;
      },
      {}
    );

  // =========================
  // AUTH ERROR
  // =========================

  if (authError) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">
            انتهت الجلسة
          </p>

          <button
            onClick={() =>
              (window.location.href =
                "/sign-in")
            }
            className="bg-teal-600 text-white px-4 py-2 rounded-xl"
          >
            تسجيل الدخول
          </button>
        </div>
      </div>
    );
  }

  // =========================
  // UI
  // =========================

  return (
    <div
      className="flex h-full w-full bg-[#f0f7f7] overflow-hidden"
      dir="rtl"
    >
      {/* ===================== */}
      {/* DOCTORS LIST */}
      {/* ===================== */}

      {!conversationId && (
        <aside
          className={`w-80 bg-white border-l border-[#e0e8e8] flex flex-col ${
            isMobile
              ? sidebarOpen
                ? "fixed inset-y-0 right-0 z-50"
                : "hidden"
              : ""
          }`}
        >
          <div className="p-4 border-b border-[#e8f0f0]">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-[#0d5c5c]">
                الأطباء
              </h2>

              {isMobile && (
                <button
                  onClick={() =>
                    setSidebarOpen(false)
                  }
                  className="p-1.5 rounded-full hover:bg-[#f0f7f7]"
                >
                  <XCircle className="w-4 h-4 text-[#6b9e9e]" />
                </button>
              )}
            </div>

            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8ab5b5]" />

              <input
                type="text"
                placeholder="ابحث عن طبيب..."
                value={searchTerm}
                onChange={(e) =>
                  handleSearch(
                    e.target.value
                  )
                }
                className="w-full pr-10 pl-3 py-3 bg-[#f5fafa] rounded-2xl text-sm outline-none"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-6 h-6 animate-spin text-[#0d7377]" />
              </div>
            ) : searchResults.length === 0 ? (
              <div className="text-center py-10 text-[#8ab5b5] text-sm">
                ابحث عن طبيب لبدء المحادثة
              </div>
            ) : (
              searchResults.map(
                (doctor: any) => (
                  <button
                    key={doctor.id}
                    onClick={() =>
                      startNewConversation(
                        doctor
                      )
                    }
                    className="w-full flex items-center gap-3 p-4 hover:bg-[#f5fafa] border-b border-[#f0f7f7] transition-all text-right"
                  >
                    <div className="w-12 h-12 rounded-full bg-[#0d7377] flex items-center justify-center text-white font-bold">
                      {doctor.name?.charAt(
                        0
                      )}
                    </div>

                    <div className="flex-1">
                      <h3 className="font-semibold text-[#0d5c5c]">
                        {doctor.name}
                      </h3>

                      <p className="text-xs text-[#0d7377]">
                        {doctor.specialty}
                      </p>
                    </div>

                    <UserPlus className="w-4 h-4 text-[#0d7377]" />
                  </button>
                )
              )
            )}
          </div>
        </aside>
      )}

      {/* ===================== */}
      {/* CHAT */}
      {/* ===================== */}

      <main className="flex-1 flex flex-col bg-white">
        {/* HEADER */}

        <div className="px-4 py-3 border-b border-[#e8f0f0] flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isMobile &&
              !conversationId && (
                <button
                  onClick={() =>
                    setSidebarOpen(true)
                  }
                  className="p-2 rounded-full hover:bg-[#f5fafa]"
                >
                  <ArrowLeft className="w-4 h-4 text-[#6b9e9e]" />
                </button>
              )}

            <div className="w-10 h-10 rounded-full bg-[#0d7377] flex items-center justify-center text-white font-bold">
              {(
                selectedDoctor?.name ||
                otherPerson?.name ||
                "?"
              )[0]}
            </div>

            <div>
              <h3 className="font-bold text-[#0d5c5c]">
                {selectedDoctor?.name ||
                  otherPerson?.name ||
                  "اختر طبيب"}
              </h3>

              {(selectedDoctor?.specialty ||
                otherPerson?.specialty) && (
                <p className="text-xs text-[#0d7377]">
                  {selectedDoctor?.specialty ||
                    otherPerson?.specialty}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button className="p-2 rounded-full hover:bg-[#f5fafa]">
              <Phone className="w-4 h-4 text-[#6b9e9e]" />
            </button>

            <button className="p-2 rounded-full hover:bg-[#f5fafa]">
              <Video className="w-4 h-4 text-[#6b9e9e]" />
            </button>

            <button className="p-2 rounded-full hover:bg-[#f5fafa]">
              <MoreVertical className="w-4 h-4 text-[#6b9e9e]" />
            </button>
          </div>
        </div>

        {/* MESSAGES */}

        <div className="flex-1 overflow-y-auto px-4 py-3">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full">
              <MessageCircle className="w-12 h-12 text-[#d0e8e8] mb-3" />

              <p className="text-sm text-[#8ab5b5]">
                لا توجد رسائل بعد
              </p>
            </div>
          ) : (
            Object.entries(
              groupedMessages
            ).map(
              (
                [
                  date,
                  dateMessages,
                ]: any
              ) => (
                <div key={date}>
                  <div className="flex justify-center my-4">
                    <div className="bg-[#f0f7f7] text-[#8ab5b5] text-xs px-3 py-1 rounded-full">
                      {format(
                        new Date(date),
                        "EEEE, d MMMM yyyy",
                        {
                          locale: ar,
                        }
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    {dateMessages.map(
                      (msg: any) => (
                        <MessageBubble
                          key={msg.id}
                          message={msg}
                          isOwn={
                            msg.senderId ===
                            currentUserId
                          }
                        />
                      )
                    )}
                  </div>
                </div>
              )
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

          <div ref={bottomRef} />
        </div>

        {/* INPUT */}

        {conversationId && (
          <ChatInput
            onSend={handleSend}
            isSending={isSending}
          />
        )}
      </main>
    </div>
  );
}