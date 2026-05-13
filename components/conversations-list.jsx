"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getMyConversations } from "@/actions/chat";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle } from "lucide-react";
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

  return (
    <Card className="border-blue-900/20">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-white flex items-center">
          <MessageCircle className="h-5 w-5 mr-2 text-blue-400" />
          المحادثات
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">جارٍ تحميل المحادثات...</p>
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <h3 className="text-xl font-medium text-white mb-2">
              لا توجد محادثات بعد
            </h3>
            <p className="text-muted-foreground text-sm">
              {userRole === "DOCTOR"
                ? "سيظهر هنا المرضى الذين بدأوا التواصل معك"
                : "ابدأ محادثة مع طبيب من صفحة البحث"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((conv) => {
              const otherPerson =
                currentUserId === conv.patientId ? conv.doctor : conv.patient;
              const lastMessage = conv.messages?.[0];

              return (
                <div
                  key={conv.id}
                  onClick={() => router.push(`/chat/${conv.id}`)}
                  className="flex items-center gap-3 p-3 rounded-lg border border-blue-900/20 hover:bg-blue-900/10 cursor-pointer transition-colors"
                >
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarImage src={otherPerson?.imageUrl} />
                    <AvatarFallback className="bg-blue-900/30 text-blue-300">
                      {otherPerson?.name?.[0] ?? "؟"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-white font-medium text-sm truncate">
                        {otherPerson?.name ?? "مجهول"}
                      </p>
                      {lastMessage && (
                        <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                          {formatDistanceToNow(new Date(lastMessage.createdAt), {
                            addSuffix: true,
                            locale: ar,
                          })}
                        </span>
                      )}
                    </div>
                    {otherPerson?.specialty && (
                      <p className="text-xs text-blue-400 mb-0.5">
                        {otherPerson.specialty}
                      </p>
                    )}
                    <p className="text-muted-foreground text-xs truncate">
                      {lastMessage?.content ?? "لا توجد رسائل بعد"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}