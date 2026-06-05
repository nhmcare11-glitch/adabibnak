"use client";

import { useState, useRef, useCallback } from "react";
import { Send, Paperclip, Smile, Loader2, X, Mic, Image, FileText } from "lucide-react";
import EmojiPicker, { Theme } from "emoji-picker-react";
import { useTheme } from "next-themes";
import VoiceRecorder from "./VoiceRecorder";

interface FilePreview {
  file: File;
  preview: string | null;
  type: string;
  name: string;
  size: number;
}

interface ChatInputProps {
  onSend: (text: string, files: File[]) => void;
  onSendVoice: (blob: Blob, duration: number) => Promise<void>;
  disabled?: boolean;
  isSending?: boolean;
  placeholder?: string;
}

export default function ChatInput({
  onSend,
  onSendVoice,
  disabled = false,
  isSending = false,
  placeholder = "اكتب رسالتك هنا...",
}: ChatInputProps) {
  const [input, setInput] = useState("");
  const [files, setFiles] = useState<FilePreview[]>([]);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const { theme } = useTheme();

  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const previews: FilePreview[] = selectedFiles.map((file) => ({
      file,
      preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
      type: file.type,
      name: file.name,
      size: file.size,
    }));
    setFiles((prev) => [...prev, ...previews]);
    e.target.value = "";
  };

  const removeFile = (index: number) => {
    setFiles((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      if (prev[index].preview) URL.revokeObjectURL(prev[index].preview!);
      return updated;
    });
  };

  const handleSend = useCallback(() => {
    const text = input.trim();
    const fileList = files.map((f) => f.file);
    if ((!text && fileList.length === 0) || disabled || isSending) return;
    onSend(text, fileList);
    setInput("");
    setFiles([]);
    setShowEmoji(false);
    inputRef.current?.focus();
  }, [input, files, disabled, isSending, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEmojiSelect = (emojiData: { emoji: string }) => {
    setInput((prev) => prev + emojiData.emoji);
    inputRef.current?.focus();
  };

  const handleVoiceSend = async (blob: Blob, duration: number) => {
    await onSendVoice(blob, duration);
    setShowVoiceRecorder(false);
  };

  const canSend = input.trim().length > 0 || files.length > 0;

  return (
    <div className="bg-white border-t border-[#e0eeee] flex-shrink-0">

      {/* Quick attach chips */}
      <div className="flex gap-2 px-3 pt-2 pb-1">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isSending}
          className="flex items-center gap-1.5 text-[10px] text-[#0d7377] bg-[#f0fafa] border border-[#c5e5e5] px-2.5 py-1 rounded-full hover:bg-[#e0f5f5] transition-colors disabled:opacity-40"
        >
          <Image size={11} />
          صورة
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isSending}
          className="flex items-center gap-1.5 text-[10px] text-[#0d7377] bg-[#f0fafa] border border-[#c5e5e5] px-2.5 py-1 rounded-full hover:bg-[#e0f5f5] transition-colors disabled:opacity-40"
        >
          <FileText size={11} />
          ملف طبي
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isSending}
          className="flex items-center gap-1.5 text-[10px] text-[#0d7377] bg-[#f0fafa] border border-[#c5e5e5] px-2.5 py-1 rounded-full hover:bg-[#e0f5f5] transition-colors disabled:opacity-40"
        >
          <Paperclip size={11} />
          مرفق
        </button>
      </div>

      {/* File previews */}
      {files.length > 0 && (
        <div className="flex gap-2 px-3 py-1.5 overflow-x-auto">
          {files.map((file, i) => (
            <div key={i} className="relative group flex-shrink-0">
              <div
                className={`w-12 h-12 rounded-xl border border-[#d5eaea] overflow-hidden ${
                  file.type.startsWith("image/") ? "" : "flex flex-col items-center justify-center bg-[#f5fafa]"
                }`}
              >
                {file.type.startsWith("image/") && file.preview ? (
                  <img src={file.preview} alt={file.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[8px] text-[#8ab5b5] px-1 truncate max-w-full">{file.name.slice(0, 7)}</span>
                )}
              </div>
              <button
                onClick={() => removeFile(i)}
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-400 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
              >
                <X size={9} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main input row */}
      <div className="flex items-center gap-1.5 px-3 pb-2.5">

        {/* إذا فُتح المسجل يأخذ مكان السطر كله */}
        {showVoiceRecorder ? (
          <div className="flex-1">
            <VoiceRecorder onSend={handleVoiceSend} onCancel={() => setShowVoiceRecorder(false)} />
          </div>
        ) : (
          <>
            {/* Emoji */}
            <div className="relative">
              <button
                onClick={() => setShowEmoji(!showEmoji)}
                className={`w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#f0fafa] transition-colors ${
                  showEmoji ? "text-[#0d7377]" : "text-[#6b9e9e]"
                }`}
              >
                <Smile size={17} />
              </button>
              {showEmoji && (
                <div className="absolute bottom-full right-0 mb-1 z-50">
                  <div className="relative">
                    <EmojiPicker
                      onEmojiClick={handleEmojiSelect}
                      theme={theme === "dark" ? Theme.DARK : Theme.LIGHT}
                      width={280}
                      height={320}
                      lazyLoadEmojis
                      searchPlaceholder="بحث..."
                    />
                    <button
                      onClick={() => setShowEmoji(false)}
                      className="absolute -top-2 -left-2 w-5 h-5 rounded-full bg-white border border-[#d5eaea] flex items-center justify-center shadow-sm"
                    >
                      <X size={10} className="text-[#6b9e9e]" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Text input */}
            <div className="flex-1">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                disabled={disabled || isSending}
                className="w-full px-4 py-2 bg-[#f3f8f8] border border-[#d5eaea] rounded-2xl text-[12px] text-[#0d3d3d] placeholder:text-[#9ab8b8] focus:outline-none focus:border-[#0d7377]/40 focus:ring-2 focus:ring-[#0d7377]/10 transition-all disabled:opacity-50"
              />
            </div>

            {/* Voice */}
            <button
              onClick={() => setShowVoiceRecorder(true)}
              disabled={disabled || isSending}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#f0fafa] transition-colors text-[#6b9e9e] hover:text-[#0d7377] disabled:opacity-40"
            >
              <Mic size={17} />
            </button>

            {/* Send */}
            <button
              onClick={handleSend}
              disabled={!canSend || disabled || isSending}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${
                canSend && !disabled && !isSending
                  ? "bg-[#0d7377] hover:bg-[#0a5c5f] text-white shadow-sm hover:shadow-md"
                  : "bg-[#e8f4f4] text-[#9ab8b8] cursor-not-allowed"
              }`}
            >
              {isSending ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Send size={15} />
              )}
            </button>
          </>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        accept="image/*,audio/*,video/*,application/pdf,.doc,.docx,.xls,.xlsx,.csv,.dcm,.zip,.rar"
      />
    </div>
  );
}