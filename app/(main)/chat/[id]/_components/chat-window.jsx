"use client";

import { useEffect, useRef, useState, useTransition, useCallback } from "react";
import { sendMessage, getMessages, markMessagesAsRead, uploadFile, getMyConversations, getOrCreateConversation, searchDoctors } from "@/actions/chat";
import { format, formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import Link from "next/link";
import { toast } from "sonner";
import EmojiPicker from "emoji-picker-react";
import {
  Send,
  Loader2,
  Paperclip,
  Smile,
  File,
  Mic,
  X,
  Check,
  CheckCheck,
  Search,
  UserPlus,
  XCircle,
  Home,
  MessageCircle,
  Settings,
  LogOut,
  Phone,
  Video,
  MoreVertical,
  ArrowRight,
  Menu,
  Calendar,
} from "lucide-react";

export default function ChatWindow({
  conversationId,
  initialMessages,
  currentUserId,
  otherPerson: initialOtherPerson,
  conversations: initialConversations,
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [conversations, setConversations] = useState(initialConversations);
  const [input, setInput] = useState("");
  const [isPending, startTransition] = useTransition();
  const [showEmoji, setShowEmoji] = useState(false);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingTimer, setRecordingTimer] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [otherPerson] = useState(initialOtherPerson);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Polling for new messages
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const data = await getMessages(conversationId);
        setMessages(data.messages);
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [conversationId]);

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
  const handleSearch = async (term) => {
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
  const startNewConversation = async (doctor) => {
    try {
      const { conversation } = await getOrCreateConversation(doctor.id);
      window.location.href = `/chat/${conversation.id}`;
    } catch (err) {
      toast.error("فشل بدء المحادثة");
    }
  };

  // Handle file selection
  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const filePreviews = selectedFiles.map(file => ({
      file,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
      type: file.type,
      name: file.name,
      size: file.size,
    }));
    setFiles(prev => [...prev, ...filePreviews]);
  };

  // Remove file
  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Upload and send
  const uploadAndSend = async () => {
    if ((!input.trim() && files.length === 0) || isPending) return;

    const optimisticMsg = {
      id: `temp-${Date.now()}`,
      content: input.trim(),
      senderId: currentUserId,
      createdAt: new Date().toISOString(),
      sender: { id: currentUserId, name: "أنت" },
      files: files.map(f => ({ name: f.name, type: f.type })),
      status: "sending",
      read: false,
      isTemp: true,
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    const sentInput = input.trim();
    setInput("");
    const currentFiles = [...files];
    setFiles([]);
    setShowEmoji(false);

    startTransition(async () => {
      try {
        let uploadedFiles = [];
        if (currentFiles.length > 0) {
          setUploading(true);
          const formData = new FormData();
          currentFiles.forEach(f => formData.append("files", f.file));
          const uploadResult = await uploadFile(formData);
          uploadedFiles = uploadResult.files;
          setUploading(false);
        }

        const data = await sendMessage(conversationId, sentInput, uploadedFiles);
        
        setMessages((prev) =>
          prev.map((m) => 
            m.id === optimisticMsg.id 
              ? { ...data.message, status: "sent", isTemp: false }
              : m
          )
        );
        
        await markMessagesAsRead(conversationId);
        loadConversations();
      } catch (err) {
        toast.error("فشل إرسال الرسالة");
        setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
        setInput(sentInput);
        setFiles(currentFiles);
      }
    });
  };

  // Mark messages as read when viewed
  useEffect(() => {
    const markRead = async () => {
      const unreadMessages = messages.filter(
        m => m.senderId !== currentUserId && !m.read
      );
      if (unreadMessages.length > 0) {
        await markMessagesAsRead(conversationId);
        setMessages(prev => 
          prev.map(m => 
            m.senderId !== currentUserId && !m.read 
              ? { ...m, read: true, status: "read" }
              : m
          )
        );
      }
    };
    markRead();
  }, [messages, conversationId, currentUserId]);

  // Start recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], `voice-${Date.now()}.webm`, { type: 'audio/webm' });
        
        const formData = new FormData();
        formData.append("files", audioFile);
        const uploadResult = await uploadFile(formData);
        
        const voiceMsg = {
          id: `temp-${Date.now()}`,
          content: "🎤 رسالة صوتية",
          senderId: currentUserId,
          createdAt: new Date().toISOString(),
          files: uploadResult.files,
          status: "sending",
          isTemp: true,
        };
        
        setMessages(prev => [...prev, voiceMsg]);
        
        const data = await sendMessage(conversationId, "🎤 رسالة صوتية", uploadResult.files);
        setMessages(prev =>
          prev.map((m) => 
            m.id === voiceMsg.id 
              ? { ...data.message, status: "sent", isTemp: false }
              : m
          )
        );
        
        await markMessagesAsRead(conversationId);
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
      
      let time = 0;
      const interval = setInterval(() => {
        time++;
        setRecordingTime(time);
        if (time >= 60) stopRecording();
      }, 1000);
      setRecordingTimer(interval);
    } catch (err) {
      console.error("Recording error:", err);
      toast.error("لا يمكن الوصول إلى الميكروفون");
    }
  };
  
  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      setRecordingTime(0);
      if (recordingTimer) clearInterval(recordingTimer);
    }
  };

  const handleSend = () => {
    uploadAndSend();
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 B";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1048576).toFixed(1) + " MB";
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getMessageStatus = (msg) => {
    if (msg.status === "sending") return <Loader2 size={10} className="animate-spin" />;
    if (msg.status === "sent") return <Check size={12} />;
    if (msg.read === true) return <CheckCheck size={12} color="#34b7f1" />;
    return null;
  };

  const openFile = (url) => {
    if (url) window.open(url, "_blank");
  };

  const getLastSeen = (date) => {
    if (!date) return "Recently";
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: Home, href: "/" },
    { id: "appointments", label: "Appointments", icon: Calendar, href: "/appointments" },
    { id: "chat", label: "Chat", icon: MessageCircle, href: "/chat", active: true },
    { id: "settings", label: "Settings", icon: Settings, href: "/settings" },
  ];

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = format(new Date(message.createdAt), "yyyy-MM-dd");
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {});

  return (
    <div style={{ display: "flex", width: "100%", height: "100vh", direction: "ltr", background: "#f5f7fb", fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
      
      {/* القائمة الجانبية - مصغرة */}
      <div style={{ 
        width: sidebarCollapsed ? "70px" : "240px", 
        background: "#fff", 
        borderRight: "1px solid #e5e7eb", 
        display: "flex", 
        flexDirection: "column", 
        transition: "width 0.3s ease",
        overflow: "hidden"
      }}>
        {/* Logo */}
        <div style={{ padding: "20px", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {!sidebarCollapsed && <span style={{ fontSize: "18px", fontWeight: "bold", color: "#2563eb" }}>Chats</span>}
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} style={{ background: "none", border: "none", cursor: "pointer" }}>
            <Menu size={18} color="#64748b" />
          </button>
        </div>
        
        {/* Menu Items */}
        <div style={{ flex: 1, padding: "16px 0" }}>
          {menuItems.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px 20px",
                textDecoration: "none",
                color: item.id === "chat" ? "#2563eb" : "#64748b",
                background: item.id === "chat" ? "#eff6ff" : "transparent",
                borderRight: item.id === "chat" ? "3px solid #2563eb" : "none",
                transition: "all 0.2s",
                justifyContent: sidebarCollapsed ? "center" : "flex-start",
              }}
            >
              <item.icon size={20} />
              {!sidebarCollapsed && <span style={{ fontSize: "14px", fontWeight: 500 }}>{item.label}</span>}
            </Link>
          ))}
        </div>
        
        {/* User Avatar */}
        <div style={{ padding: "16px", borderTop: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: "12px", justifyContent: sidebarCollapsed ? "center" : "flex-start" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#2563eb", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: 600 }}>
            {currentUserId?.charAt(0)?.toUpperCase() || "U"}
          </div>
          {!sidebarCollapsed && (
            <div>
              <div style={{ fontSize: "13px", fontWeight: 600, color: "#111827" }}>My Account</div>
              <div style={{ fontSize: "10px", color: "#9ca3af" }}>View profile</div>
            </div>
          )}
        </div>
      </div>

      {/* قائمة المحادثات */}
      <div style={{ width: "340px", background: "#fff", borderRight: "1px solid #e5e7eb", display: "flex", flexDirection: "column" }}>
        {/* Search Bar */}
        <div style={{ padding: "16px", borderBottom: "1px solid #e5e7eb" }}>
          <div style={{ position: "relative" }}>
            <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
            <input
              type="text"
              placeholder="Search"
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              style={{ width: "100%", padding: "8px 12px 8px 36px", border: "none", background: "#f3f4f6", borderRadius: "20px", fontSize: "13px", outline: "none" }}
            />
            {searchTerm && (
              <XCircle size={14} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af", cursor: "pointer" }} onClick={() => handleSearch("")} />
            )}
          </div>
          
          {/* Search Results */}
          {showSearchResults && searchResults.length > 0 && (
            <div style={{ position: "absolute", top: "70px", left: "260px", width: "300px", background: "#fff", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.15)", zIndex: 100, overflow: "hidden", border: "1px solid #e5e7eb" }}>
              {searchResults.map((doctor) => (
                <div key={doctor.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px", cursor: "pointer", borderBottom: "1px solid #e5e7eb" }} onClick={() => startNewConversation(doctor)}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#dbeafe", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", fontWeight: 600, color: "#1d4ed8" }}>{doctor.name?.[0] || "D"}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "14px", fontWeight: 600, color: "#111827" }}>{doctor.name}</div>
                    <div style={{ fontSize: "11px", color: "#3b82f6" }}>{doctor.specialty}</div>
                  </div>
                  <button style={{ width: "28px", height: "28px", borderRadius: "50%", background: "#eff6ff", border: "none", cursor: "pointer" }}><UserPlus size={14} color="#3b82f6" /></button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Conversations List */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {conversations?.map((conv) => {
            const isActive = conv.id === conversationId;
            const other = conv.patientId === currentUserId ? conv.doctor : conv.patient;
            const lastMsg = conv.lastMessage || (conv.lastMessageHasFiles ? "📎 File attached" : "No messages yet");
            const lastSeen = conv.lastMessageTime ? formatDistanceToNow(new Date(conv.lastMessageTime), { addSuffix: true }) : "Recently";
            
            return (
              <Link key={conv.id} href={`/chat/${conv.id}`} style={{ textDecoration: "none" }}>
                <div style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "12px", 
                  padding: "12px 16px", 
                  cursor: "pointer", 
                  background: isActive ? "#f0f7ff" : "transparent",
                  borderBottom: "1px solid #f0f0f0",
                  transition: "background 0.2s",
                }}>
                  <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#e8eef5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", fontWeight: 600, color: "#4a6fa5" }}>
                    {other?.name?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "2px" }}>
                      <span style={{ fontSize: "14px", fontWeight: 600, color: "#111827" }}>{other?.name || "Conversation"}</span>
                      <span style={{ fontSize: "10px", color: "#9ca3af" }}>
                        {conv.lastMessageTime ? format(new Date(conv.lastMessageTime), "h:mm a") : ""}
                      </span>
                    </div>
                    {other?.specialty && (
                      <div style={{ fontSize: "11px", color: "#3b82f6", marginBottom: "2px" }}>{other.specialty}</div>
                    )}
                    <div style={{ fontSize: "11px", color: "#9ca3af", marginBottom: "2px" }}>
                      last online {lastSeen}
                    </div>
                    <div style={{ fontSize: "12px", color: "#6b7280", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {lastMsg}
                    </div>
                  </div>
                  {conv.unreadCount > 0 && (
                    <div style={{ minWidth: "18px", height: "18px", background: "#ef4444", borderRadius: "10px", fontSize: "10px", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 5px" }}>
                      {conv.unreadCount}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
          
          {conversations?.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px", color: "#9ca3af" }}>
              <MessageCircle size={32} style={{ marginBottom: "12px", opacity: 0.5 }} />
              <p style={{ fontSize: "13px" }}>No conversations yet</p>
              <p style={{ fontSize: "11px" }}>Search for doctors to start chatting</p>
            </div>
          )}
        </div>
      </div>

      {/* Chat Window */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#f8fafc" }}>
        
        {/* Chat Header */}
        <div style={{ background: "#fff", padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #e5e7eb" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: "linear-gradient(135deg, #fbbf24, #f59e0b)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", fontWeight: 700, color: "#fff" }}>
              {otherPerson?.name?.[0]?.toUpperCase() || "?"}
            </div>
            <div>
              <div style={{ fontSize: "15px", fontWeight: 700, color: "#111827" }}>{otherPerson?.name || "Select a chat"}</div>
              <div style={{ fontSize: "11px", color: "#10b981" }}>● Online</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            <button style={{ width: "34px", height: "34px", borderRadius: "50%", background: "#f3f4f6", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Phone size="16" color="#64748b" />
            </button>
            <button style={{ width: "34px", height: "34px", borderRadius: "50%", background: "#f3f4f6", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Video size="16" color="#64748b" />
            </button>
            <button style={{ width: "34px", height: "34px", borderRadius: "50%", background: "#f3f4f6", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <MoreVertical size="16" color="#64748b" />
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
          {Object.entries(groupedMessages).map(([date, dateMessages]) => (
            <div key={date}>
              <div style={{ textAlign: "center", margin: "16px 0 12px 0" }}>
                <span style={{ fontSize: "10px", color: "#9ca3af", background: "#f1f5f9", padding: "4px 12px", borderRadius: "20px" }}>
                  {format(new Date(date), "MMMM d, yyyy")}
                </span>
              </div>
              {dateMessages.map((msg) => {
                const isOwn = msg.senderId === currentUserId;
                return (
                  <div key={msg.id} style={{ display: "flex", justifyContent: isOwn ? "flex-end" : "flex-start", marginBottom: "12px" }}>
                    <div style={{ maxWidth: "70%" }}>
                      {/* Files */}
                      {msg.files?.map((file, i) => (
                        <div key={i} style={{ marginBottom: "8px" }}>
                          {file.type?.startsWith('image/') ? (
                            <img 
                              src={file.url} 
                              alt="upload" 
                              style={{ maxWidth: "220px", maxHeight: "180px", borderRadius: "12px", cursor: "pointer", border: "1px solid #e5e7eb" }} 
                              onClick={() => openFile(file.url)}
                            />
                          ) : file.type?.startsWith('audio/') ? (
                            <div style={{ background: "#fff", borderRadius: "20px", padding: "8px 16px", border: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: "10px" }}>
                              <Mic size="16" color="#2563eb" />
                              <audio controls src={file.url} style={{ height: "34px" }} />
                            </div>
                          ) : (
                            <div 
                              style={{ display: "flex", alignItems: "center", gap: "12px", padding: "8px 16px", background: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb", cursor: "pointer" }} 
                              onClick={() => openFile(file.url)}
                            >
                              <File size="20" color="#2563eb" />
                              <div>
                                <div style={{ fontSize: "12px", fontWeight: 500, color: "#111827" }}>{file.name}</div>
                                <div style={{ fontSize: "9px", color: "#9ca3af" }}>{formatFileSize(file.size)}</div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                      {/* Message Text */}
                      {msg.content && msg.content !== "🎤 رسالة صوتية" && (
                        <div style={{ 
                          padding: "8px 14px", 
                          borderRadius: "18px", 
                          fontSize: "13px", 
                          lineHeight: 1.5, 
                          background: isOwn ? "#2563eb" : "#fff", 
                          color: isOwn ? "#fff" : "#111827", 
                          borderTopRightRadius: isOwn ? "4px" : "18px",
                          borderTopLeftRadius: isOwn ? "18px" : "4px",
                          border: isOwn ? "none" : "1px solid #e5e7eb",
                        }}>
                          {msg.content}
                        </div>
                      )}
                      {/* Time & Status */}
                      <div style={{ fontSize: "9px", color: "#9ca3af", marginTop: "4px", textAlign: isOwn ? "right" : "left", direction: "ltr" }}>
                        {format(new Date(msg.createdAt), "h:mm a")}
                        {isOwn && <span style={{ marginLeft: "4px" }}>{getMessageStatus(msg)}</span>}
                        {msg.isTemp && <span style={{ marginLeft: "4px" }}> • Sending...</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
          {messages.length === 0 && (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <MessageCircle size={48} style={{ marginBottom: "16px", color: "#cbd5e1" }} />
              <p style={{ fontSize: "14px", color: "#64748b" }}>No messages yet</p>
              <p style={{ fontSize: "12px", color: "#94a3b8" }}>Start a conversation by typing a message below</p>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* File Previews */}
        {files.length > 0 && (
          <div style={{ display: "flex", gap: "8px", padding: "12px 20px", background: "#fff", borderTop: "1px solid #e5e7eb", overflowX: "auto" }}>
            {files.map((file, i) => (
              <div key={i} style={{ position: "relative", width: "60px", height: "60px", borderRadius: "8px", border: "1px solid #e5e7eb", flexShrink: 0, background: "#f9fafb" }}>
                {file.preview ? (
                  <img src={file.preview} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "8px" }} />
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%" }}>
                    <File size="20" color="#64748b" />
                    <span style={{ fontSize: "7px", textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", width: "55px" }}>{file.name.substring(0, 6)}</span>
                  </div>
                )}
                <button onClick={() => removeFile(i)} style={{ position: "absolute", top: "-6px", right: "-6px", width: "18px", height: "18px", borderRadius: "50%", background: "#ef4444", color: "#fff", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <X size="10" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input Area */}
        <div style={{ background: "#fff", padding: "14px 20px", borderTop: "1px solid #e5e7eb" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "#f3f4f6", borderRadius: "28px", padding: "4px 8px 4px 16px" }}>
            <button onClick={() => fileInputRef.current?.click()} style={{ background: "none", border: "none", cursor: "pointer", padding: "8px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Paperclip size="18" color="#64748b" />
            </button>
            <input ref={fileInputRef} type="file" multiple onChange={handleFileSelect} style={{ display: "none" }} />
            
            <button onClick={() => setShowEmoji(!showEmoji)} style={{ background: "none", border: "none", cursor: "pointer", padding: "8px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Smile size="18" color="#64748b" />
            </button>
            
            {!isRecording ? (
              <button onClick={startRecording} style={{ background: "none", border: "none", cursor: "pointer", padding: "8px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Mic size="18" color="#64748b" />
              </button>
            ) : (
              <button onClick={stopRecording} style={{ background: "#ef4444", border: "none", cursor: "pointer", padding: "6px 12px", borderRadius: "20px", color: "#fff", fontSize: "11px", display: "flex", alignItems: "center", gap: "6px" }}>
                <span>⏹️</span> {formatDuration(recordingTime)}
              </button>
            )}
            
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              style={{ flex: 1, border: "none", background: "transparent", padding: "10px 0", fontSize: "13px", outline: "none" }}
            />
            
            <button
              onClick={handleSend}
              disabled={(!input.trim() && files.length === 0) || isPending || uploading}
              style={{
                width: "34px",
                height: "34px",
                borderRadius: "50%",
                border: "none",
                background: (!input.trim() && files.length === 0) || isPending || uploading ? "#e2e8f0" : "#2563eb",
                cursor: (!input.trim() && files.length === 0) || isPending || uploading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {(isPending || uploading) ? <Loader2 size="16" color="#fff" className="animate-spin" /> : <Send size="14" color="#fff" />}
            </button>
          </div>
          
          {showEmoji && (
            <div style={{ position: "relative" }}>
              <EmojiPicker onEmojiClick={(emoji) => setInput(prev => prev + emoji.emoji)} style={{ position: "absolute", bottom: "70px", right: "0", zIndex: 1000 }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Animation styles
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .animate-spin { animation: spin 1s linear infinite; }
  `;
  document.head.appendChild(style);
}