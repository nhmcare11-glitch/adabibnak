"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getMyConversations } from "@/actions/chat";
import { MessageCircle, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import useFetch from "@/hooks/use-fetch";

export default function ConversationsList({ userRole }) {
  const router = useRouter();
  const { loading, data, fn: fetchConversations } = useFetch(getMyConversations);

  useEffect(() => {
    fetchConversations();
  }, []);

  const conversations = data?.conversations || [];
  const currentUserId = data?.currentUserId;

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-8">
        <div className="flex flex-col items-center justify-center gap-3">
          <Loader2 size={28} className="animate-spin text-teal-500" />
          <p className="text-sm text-slate-500 dark:text-slate-400">
            جارٍ تحميل المحادثات...
          </p>
        </div>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-8">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-100 to-cyan-100 dark:from-teal-900/30 dark:to-cyan-900/30 flex items-center justify-center mx-auto mb-4">
            <MessageCircle size={28} className="text-teal-500 dark:text-teal-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">
            لا توجد محادثات بعد
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {userRole === "DOCTOR"
              ? "سيظهر هنا المرضى الذين بدأوا التواصل معك"
              : "ابدأ محادثة مع طبيب من صفحة البحث"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <MessageCircle size={20} className="text-teal-500" />
          المحادثات
        </h2>
      </div>
      <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
        {conversations.map((conv) => {
          const otherPerson =
            currentUserId === conv.patientId ? conv.doctor : conv.patient;
          const lastMessage = conv.messages?.[0];
          const unreadCount = conv.unreadCount || 0;

          return (
            <button
              key={conv.id}
              onClick={() => router.push(`/chat/${conv.id}`)}
              className="w-full flex items-center gap-3 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-right"
            >
              <div className="relative flex-shrink-0">
                {otherPerson?.imageUrl ? (
                  <img
                    src={otherPerson.imageUrl}
                    alt={otherPerson.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-slate-100 dark:border-slate-700"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white font-bold text-lg">
                    {otherPerson?.name?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                )}
                {unreadCount > 0 && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white dark:border-slate-900">
                    {unreadCount}
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0 text-right">
                <div className="flex items-center justify-between mb-0.5">
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                    {otherPerson?.name || "مجهول"}
                  </h3>
                  {lastMessage && (
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 flex-shrink-0">
                      {formatDistanceToNow(new Date(lastMessage.createdAt), {
                        addSuffix: true,
                        locale: ar,
                      })}
                    </span>
                  )}
                </div>
                {otherPerson?.specialty && (
                  <p className="text-[11px] text-teal-600 dark:text-teal-400 mb-0.5">
                    {otherPerson.specialty}
                  </p>
                )}
                <p
                  className={`text-xs truncate ${
                    unreadCount > 0
                      ? "text-slate-800 dark:text-slate-200 font-medium"
                      : "text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {lastMessage?.content || "لا توجد رسائل بعد"}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}