"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import {
  MessageCircle, Loader2, Search, X,
  Stethoscope, Clock
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { toast } from "sonner";

export default function ChatListPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [authError, setAuthError] = useState(false);

  const apiCall = async (url, options = {}) => {
    const res = await fetch(url, { ...options, credentials: "include" });
    if (res.status === 401) { setAuthError(true); throw new Error("Unauthorized"); }
    if (!res.ok) { const error = await res.json().catch(() => ({ error: "Unknown error" })); throw new Error(error.error || `HTTP ${res.status}`); }
    return res.json();
  };

  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiCall("/api/chat");
      if (data && data.conversations) {
        setConversations(data.conversations);
        setCurrentUserId(data.currentUserId);
      }
    } catch (err) {
      console.error("Error fetching conversations:", err);
      if (!err.message?.includes("Unauthorized")) toast.error("فشل تحميل المحادثات");
    } finally { setLoading(false); }
  }, [user]);

  useEffect(() => { if (isLoaded) fetchConversations(); }, [isLoaded, fetchConversations]);
  useEffect(() => {
    if (!isLoaded) return;
    const interval = setInterval(() => { fetchConversations(); }, 10000);
    return () => clearInterval(interval);
  }, [isLoaded, fetchConversations]);

  const handleSearch = async (term) => {
    setSearchTerm(term);
    if (term.length < 2) { setSearchResults([]); return; }
    try { const data = await apiCall(`/api/search-doctors?q=${encodeURIComponent(term)}`); setSearchResults(data); }
    catch (err) { console.error("Search error:", err); }
  };

  const startConversation = async (doctor) => {
    try {
      const data = await apiCall("/api/chat/conversations", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doctorId: doctor.id }),
      });
      router.push(`/chat/${data.conversation.id}`);
    } catch (err) {
      if (err.message?.includes("Unauthorized")) toast.error("انتهت الجلسة - يرجى تسجيل الدخول");
      else toast.error("فشل بدء المحادثة");
    }
  };

  const filteredConversations = conversations.filter((conv) => {
    if (!searchTerm) return true;
    const other = currentUserId === conv.patientId ? conv.doctor : conv.patient;
    return (other?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || other?.specialty?.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  const totalUnread = conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);

  if (authError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f0f7f7]">
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
    <div className="min-h-screen bg-white" dir="rtl">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="p-4 border-b border-[#e8f0f0]">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-bold text-[#0d5c5c]">المحادثات</h1>
            {totalUnread > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                {totalUnread} جديد
              </span>
            )}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8ab5b5]" />
            <input 
              type="text" 
              placeholder="البحث في المحادثات أو الأطباء..." 
              value={searchTerm} 
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pr-9 pl-3 py-2.5 bg-[#f5fafa] rounded-xl text-sm text-[#0d5c5c] placeholder:text-[#8ab5b5] focus:outline-none focus:ring-1 focus:ring-[#0d7377]/30 border border-transparent"
            />
            {searchTerm && (
              <button onClick={() => { setSearchTerm(""); setSearchResults([]); }} className="absolute left-3 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-[#8ab5b5]" />
              </button>
            )}
          </div>

          {/* Search Results */}
          {searchTerm.length >= 2 && searchResults.length > 0 && (
            <div className="mt-2 bg-white rounded-xl shadow-lg border border-[#e0e8e8] overflow-hidden z-50 max-h-48 overflow-y-auto">
              <div className="px-3 py-2 border-b border-[#f0f7f7]">
                <p className="text-[10px] text-[#6b9e9e] font-medium">الأطباء المتاحون</p>
              </div>
              {searchResults.map((doctor) => (
                <button key={doctor.id} onClick={() => startConversation(doctor)} className="w-full flex items-center gap-3 p-3 hover:bg-[#f5fafa] transition-colors border-b border-[#f0f7f7] last:border-0 text-right">
                  <div className="w-10 h-10 rounded-full bg-[#0d7377] flex items-center justify-center text-white font-bold text-sm">
                    {doctor.name?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#0d5c5c] truncate">{doctor.name}</p>
                    <p className="text-[11px] text-[#0d7377]">{doctor.specialty}</p>
                  </div>
                  <Stethoscope className="w-4 h-4 text-[#0d7377]" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Conversations List */}
        <div className="divide-y divide-[#f5fafa]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-[#0d7377] mb-3" />
              <p className="text-sm text-[#6b9e9e]">جارٍ تحميل المحادثات...</p>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center py-20 px-4">
              <div className="w-20 h-20 rounded-full bg-[#f5fafa] flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-10 h-10 text-[#d0e8e8]" />
              </div>
              <h3 className="text-lg font-bold text-[#0d5c5c] mb-2">لا توجد محادثات بعد</h3>
              <p className="text-sm text-[#6b9e9e] mb-6">
                ابحث عن طبيب وابدأ محادثة للحصول على استشارة طبية
              </p>
              <button 
                onClick={() => router.push("/doctors")}
                className="inline-flex items-center gap-2 bg-[#0d7377] text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-[#0a5c5f] transition-colors"
              >
                <Stethoscope className="w-4 h-4" />
                البحث عن طبيب
              </button>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const otherPerson = currentUserId === conv.patientId ? conv.doctor : conv.patient;
              const lastMessage = conv.lastMessage;
              const unreadCount = conv.unreadCount || 0;
              const isUnread = unreadCount > 0;

              return (
                <button 
                  key={conv.id} 
                  onClick={() => router.push(`/chat/${conv.id}`)} 
                  className={`w-full flex items-center gap-3 p-4 text-right transition-all hover:bg-[#f9fdfd] ${isUnread ? "bg-white" : ""}`}
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    {otherPerson?.imageUrl ? (
                      <img src={otherPerson.imageUrl} alt={otherPerson.name} className="w-12 h-12 rounded-full object-cover border border-[#d0e8e8]" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-[#0d7377] flex items-center justify-center text-white font-bold text-lg">
                        {otherPerson?.name?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                    )}
                    <div className="absolute -bottom-0.5 -left-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className={`text-sm font-bold truncate ${isUnread ? "text-[#0d5c5c]" : "text-[#0d5c5c]/80"}`}>
                        {otherPerson?.name || "مجهول"}
                      </h3>
                      {conv.lastMessageTime && (
                        <span className="text-[10px] text-[#8ab5b5] flex-shrink-0">
                          {formatDistanceToNow(new Date(conv.lastMessageTime), { addSuffix: true, locale: ar })}
                        </span>
                      )}
                    </div>

                    {otherPerson?.specialty && (
                      <p className="text-[11px] text-[#0d7377] mb-1 flex items-center gap-1">
                        <Stethoscope className="w-3 h-3" />
                        {otherPerson.specialty}
                      </p>
                    )}

                    <div className="flex items-center justify-between">
                      <p className={`text-xs truncate flex-1 ${isUnread ? "text-[#0d5c5c] font-medium" : "text-[#8ab5b5]"}`}>
                        {conv.lastMessageHasFiles && !lastMessage?.startsWith("📎")
                          ? `📎 ${lastMessage || "ملف مرفق"}`
                          : (lastMessage || "لا توجد رسائل بعد")}
                      </p>
                      {unreadCount > 0 && (
                        <span className="flex-shrink-0 mr-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {unreadCount}
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
    </div>
  );
}