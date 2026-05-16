"use client";

import { useState, useRef, useCallback } from "react";
import { Send, Paperclip, Smile, Loader2, X } from "lucide-react";
import EmojiPicker, { Theme } from "emoji-picker-react";
import { useTheme } from "next-themes";
import VoiceRecorder from "./VoiceRecorder";
import { FilePreview } from "./FileAttachment";

interface FilePreviewItem {
  file: File;
  preview: string | null;
  type: string;
  name: string;
  size: number;
}

interface ChatInputProps {
  onSend: (text: string, files: File[]) => void;
  onSendVoice: (blob: Blob, duration: number) => void;
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
  const [files, setFiles] = useState<FilePreviewItem[]>([]);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const { theme } = useTheme();

  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const previews = selectedFiles.map((file) => ({
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
      const newFiles = prev.filter((_, i) => i !== index);
      if (prev[index].preview) URL.revokeObjectURL(prev[index].preview!);
      return newFiles;
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
    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-200/60 dark:border-slate-700/60">
      {/* File Previews */}
      {files.length > 0 && (
        <div className="flex gap-2 px-4 pt-3 pb-1 overflow-x-auto scrollbar-thin">
          {files.map((file, i) => (
            <FilePreview key={i} file={file} onRemove={() => removeFile(i)} />
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="px-4 py-3 flex items-end gap-2">
        {/* Attach Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-shrink-0 group"
          title="إرفاق ملف"
          disabled={disabled || isSending}
        >
          <Paperclip
            size={20}
            className="text-slate-500 group-hover:text-teal-600 dark:text-slate-400 dark:group-hover:text-teal-400 transition-colors"
          />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*,audio/*,video/*,application/pdf,.doc,.docx,.xls,.xlsx,.csv"
        />

        {/* Emoji Button */}
        <div className="relative">
          <button
            onClick={() => setShowEmoji(!showEmoji)}
            className={`p-2.5 rounded-full transition-colors flex-shrink-0 group ${
              showEmoji
                ? "bg-teal-50 dark:bg-teal-950/50"
                : "hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
            title="إيموجي"
          >
            <Smile
              size={20}
              className={`transition-colors ${
                showEmoji
                  ? "text-teal-600 dark:text-teal-400"
                  : "text-slate-500 group-hover:text-teal-600 dark:text-slate-400 dark:group-hover:text-teal-400"
              }`}
            />
          </button>

          {/* Emoji Picker */}
          {showEmoji && (
            <div className="absolute bottom-full left-0 mb-2 z-50">
              <div className="relative">
                <EmojiPicker
                  onEmojiClick={handleEmojiSelect}
                  theme={theme === "dark" ? Theme.DARK : Theme.LIGHT}
                  width={320}
                  height={400}
                  lazyLoadEmojis
                  searchPlaceholder="بحث..."
                />
                <button
                  onClick={() => setShowEmoji(false)}
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                >
                  <X size={12} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Voice Recorder */}
        {showVoiceRecorder ? (
          <div className="flex-1">
            <VoiceRecorder
              onSend={handleVoiceSend}
              onCancel={() => setShowVoiceRecorder(false)}
            />
          </div>
        ) : (
          <>
            {/* Voice Button */}
            <button
              onClick={() => setShowVoiceRecorder(true)}
              className="p-2.5 rounded-full hover:bg-teal-50 dark:hover:bg-teal-950/30 transition-colors flex-shrink-0 group"
              title="رسالة صوتية"
              disabled={disabled || isSending}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-slate-500 group-hover:text-teal-600 dark:text-slate-400 dark:group-hover:text-teal-400 transition-colors"
              >
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" x2="12" y1="19" y2="22" />
              </svg>
            </button>

            {/* Text Input */}
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                disabled={disabled || isSending}
                className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800/80 rounded-full text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30 dark:focus:ring-teal-500/20 transition-all"
              />
            </div>

            {/* Send Button */}
            <button
              onClick={handleSend}
              disabled={!canSend || disabled || isSending}
              className={`p-2.5 rounded-full transition-all flex-shrink-0 ${
                canSend && !disabled && !isSending
                  ? "bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white shadow-md shadow-teal-500/20 hover:shadow-lg hover:shadow-teal-500/30 hover:scale-105"
                  : "bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed"
              }`}
              title="إرسال"
            >
              {isSending ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Send size={18} className={canSend ? "text-white" : ""} />
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}