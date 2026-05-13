// app/chat/[id]/page.jsx
import { getMessages, getMyConversations } from "@/actions/chat";
import { getCurrentUser } from "@/actions/user";
import { redirect } from "next/navigation";
import ChatWindow from "./_components/chat-window";

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
    <div style={{ 
      height: "100%", 
      display: "flex",
      background: "#f0f4f8",
      borderRadius: "16px",
      overflow: "hidden",
      margin: "0",
      padding: "0",
    }}>
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