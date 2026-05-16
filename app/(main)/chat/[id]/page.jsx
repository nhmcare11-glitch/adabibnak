import { getMessages, getMyConversations } from "@/actions/chat";
import { getCurrentUser } from "@/actions/user";
import { redirect } from "next/navigation";
import ChatWindow from "@/components/chat/ChatWindow";  // ← غيّر المسار

export default async function ChatPage({ params }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const { messages, conversation, currentUserId } = await getMessages(id);
  const { conversations } = await getMyConversations();

  const otherPerson =
    currentUserId === conversation.patientId
      ? conversation.doctor
      : conversation.patient;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <ChatWindow
        conversationId={id}
        initialMessages={messages}
        currentUserId={currentUserId}
        otherPerson={otherPerson}
        conversations={conversations}
      />
    </div>
  );
}