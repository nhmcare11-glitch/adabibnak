// app/chat/layout.js
export default function ChatLayout({ children }) {
  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      overflow: "hidden",
      background: "#f0f4f8",
    }}>
      {children}
    </div>
  );
}