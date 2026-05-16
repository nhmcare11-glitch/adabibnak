"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getOrCreateConversation } from "@/actions/chat";
import { toast } from "sonner";

export default function StartChatButton({ doctorId }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleStartChat = () => {
    startTransition(async () => {
      try {
        const { conversation } = await getOrCreateConversation(doctorId);
        router.push(`/chat/${conversation.id}`);
      } catch (err) {
        toast.error("يجب تسجيل الدخول أولاً");
      }
    });
  };

  return (
    <Button
      onClick={handleStartChat}
      disabled={isPending}
      className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white border-0 shadow-md shadow-teal-500/20 hover:shadow-lg hover:shadow-teal-500/30 transition-all"
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 ml-2 animate-spin" />
      ) : (
        <MessageCircle className="h-4 w-4 ml-2" />
      )}
      بدء الدردشة
    </Button>
  );
}