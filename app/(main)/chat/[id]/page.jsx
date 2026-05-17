import { getMessages, getMyConversations } from "@/actions/chat";
import { getCurrentUser } from "@/actions/user";
import { redirect } from "next/navigation";
import ChatWindow from "@/components/chat/ChatWindow";

export default async function ChatPage({ params }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  try {
    const { messages, conversation, currentUserId } = await getMessages(id);
    const { conversations } = await getMyConversations();

    const otherPerson =
      currentUserId === conversation.patientId
        ? conversation.doctor
        : conversation.patient;

    return (
      <div className="fixed inset-0 bg-white">
        <ChatWindow
          conversationId={id}
          initialMessages={messages}
          currentUserId={currentUserId}
          otherPerson={otherPerson}
          conversations={conversations}
        />
      </div>
    );
  } catch (err) {
    console.error("Chat page error:", err);
    redirect("/chat");
  }
}