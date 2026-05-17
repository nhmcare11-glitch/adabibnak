"use client";

import { useState, useRef, useCallback } from "react";
import {
  Send,
  Paperclip,
  Smile,
  Loader2,
  X,
  Mic,
} from "lucide-react";

import EmojiPicker, { Theme } from "emoji-picker-react";
import { useTheme } from "next-themes";

import VoiceRecorder from "./VoiceRecorder";

export default function ChatInput({
  onSend,
  onSendVoice,
  disabled = false,
  isSending = false,
  placeholder = "اكتب رسالتك هنا...",
}) {
  const [input, setInput] = useState("");
  const [files, setFiles] = useState([]);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);

  const { theme } = useTheme();

  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files || []);

    const previews = selectedFiles.map((file) => ({
      file,
      preview: file.type.startsWith("image/")
        ? URL.createObjectURL(file)
        : null,
      type: file.type,
      name: file.name,
      size: file.size,
    }));

    setFiles((prev) => [...prev, ...previews]);

    e.target.value = "";
  };

  const removeFile = (index) => {
    setFiles((prev) => {
      const newFiles = prev.filter((_, i) => i !== index);

      if (prev[index].preview) {
        URL.revokeObjectURL(prev[index].preview);
      }

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

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEmojiSelect = (emojiData) => {
    setInput((prev) => prev + emojiData.emoji);
    inputRef.current?.focus();
  };

  const handleVoiceSend = async (blob, duration) => {
    await onSendVoice(blob, duration);
    setShowVoiceRecorder(false);
  };

  const canSend =
    input.trim().length > 0 || files.length > 0;

  return (
    <div className="relative border-t border-white/40 bg-white/70 backdrop-blur-2xl">

      {/* FILE PREVIEWS */}
      {files.length > 0 && (
        <div className="flex gap-3 overflow-x-auto px-5 pt-4">
          {files.map((file, i) => (
            <div
              key={i}
              className="group relative flex-shrink-0"
            >
              <div className="
                h-20 w-20 overflow-hidden rounded-2xl
                border border-white/40
                bg-white shadow-md
              ">
                {file.type.startsWith("image/") &&
                file.preview ? (
                  <img
                    src={file.preview}
                    alt={file.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="
                    flex h-full w-full items-center
                    justify-center px-2 text-center
                  ">
                    <span className="text-xs text-[#5d8b8b]">
                      {file.name.slice(0, 12)}
                    </span>
                  </div>
                )}
              </div>

              <button
                onClick={() => removeFile(i)}
                className="
                  absolute -left-2 -top-2
                  flex h-6 w-6 items-center justify-center
                  rounded-full bg-red-500 text-white
                  opacity-0 shadow-lg
                  transition-all duration-300
                  group-hover:opacity-100
                "
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* INPUT AREA */}
      <div className="flex items-end gap-3 px-5 py-4">

        {/* ATTACH */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isSending}
          className="
            flex h-11 w-11 items-center justify-center
            rounded-2xl bg-white shadow-sm
            transition-all duration-300
            hover:scale-105 hover:shadow-lg
          "
        >
          <Paperclip className="h-5 w-5 text-[#0d7377]" />
        </button>

        {/* MAIN INPUT */}
        <div className="
          relative flex-1 overflow-hidden
          rounded-[28px]
          border border-white/40
          bg-white/80
          shadow-lg
          backdrop-blur-xl
        ">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || isSending}
            className="
              w-full bg-transparent
              px-6 py-4 pr-28
              text-[15px] text-[#083434]
              placeholder:text-[#7aa6a6]
              focus:outline-none
            "
          />

          {/* INSIDE ACTIONS */}
          <div className="
            absolute left-3 top-1/2
            flex -translate-y-1/2 items-center gap-2
          ">

            {/* EMOJI */}
            <div className="relative">
              <button
                onClick={() => setShowEmoji(!showEmoji)}
                className="
                  flex h-10 w-10 items-center justify-center
                  rounded-xl transition-all
                  hover:bg-[#f2fbfb]
                "
              >
                <Smile
                  className={`h-5 w-5 ${
                    showEmoji
                      ? "text-[#0d7377]"
                      : "text-[#6b9e9e]"
                  }`}
                />
              </button>

              {showEmoji && (
                <div className="absolute bottom-14 left-0 z-50">
                  <div className="overflow-hidden rounded-3xl shadow-2xl">
                    <EmojiPicker
                      onEmojiClick={handleEmojiSelect}
                      theme={
                        theme === "dark"
                          ? Theme.DARK
                          : Theme.LIGHT
                      }
                      width={320}
                      height={420}
                      searchPlaceholder="بحث..."
                    />
                  </div>
                </div>
              )}
            </div>

            {/* MIC */}
            <button
              onClick={() => setShowVoiceRecorder(true)}
              disabled={disabled || isSending}
              className="
                flex h-10 w-10 items-center justify-center
                rounded-xl transition-all duration-300
                hover:bg-[#f2fbfb]
                hover:scale-105
              "
            >
              <Mic className="h-5 w-5 text-[#0d7377]" />
            </button>
          </div>
        </div>

        {/* SEND */}
        <button
          onClick={handleSend}
          disabled={!canSend || disabled || isSending}
          className={`
            flex h-12 w-12 items-center justify-center
            rounded-2xl shadow-xl
            transition-all duration-300

            ${
              canSend && !disabled && !isSending
                ? `
                  bg-gradient-to-br
                  from-[#0d7377]
                  to-[#14b8a6]
                  text-white
                  hover:scale-105
                  hover:shadow-2xl
                `
                : `
                  bg-[#dff3f2]
                  text-[#8ab5b5]
                  cursor-not-allowed
                `
            }
          `}
        >
          {isSending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </button>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          accept="
            image/*,
            audio/*,
            video/*,
            application/pdf,
            .doc,
            .docx,
            .xls,
            .xlsx,
            .csv,
            .dcm,
            .zip,
            .rar
          "
        />
      </div>

      {/* VOICE RECORDER */}
      {showVoiceRecorder && (
        <div className="
          absolute bottom-24 left-5 right-5 z-50
        ">
          <VoiceRecorder
            onSend={handleVoiceSend}
            onCancel={() => setShowVoiceRecorder(false)}
          />
        </div>
      )}
    </div>
  );
}