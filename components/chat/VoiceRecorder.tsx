"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Mic, Square, Play, Pause, Trash2, Send, Loader2 } from "lucide-react";
import { formatDuration } from "@/lib/chat-utils";

interface VoiceRecorderProps {
  onSend: (audioBlob: Blob, duration: number) => void;
  onCancel: () => void;
}

export default function VoiceRecorder({ onSend, onCancel }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [audioLevel, setAudioLevel] = useState<number[]>(Array(20).fill(0));

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const animationRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Audio visualization
  const visualizeAudio = useCallback(() => {
    if (!analyserRef.current || !dataArrayRef.current) return;

    const animate = () => {
      if (!analyserRef.current || !dataArrayRef.current) return;
      analyserRef.current.getByteFrequencyData(dataArrayRef.current);
      const bars = Array.from(dataArrayRef.current).slice(0, 20).map(v => v / 255);
      setAudioLevel(bars);
      animationRef.current = requestAnimationFrame(animate);
    };
    animate();
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Set up audio context for visualization
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      analyserRef.current = analyser;
      dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);

      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(track => track.stop());
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setIsPaused(false);

      // Start timer
      let time = 0;
      timerRef.current = setInterval(() => {
        time++;
        setRecordingTime(time);
        if (time >= 300) stopRecording(); // Max 5 minutes
      }, 1000);

      visualizeAudio();
    } catch (err) {
      console.error("Recording error:", err);
      alert("لا يمكن الوصول إلى الميكروفون. يرجى التحقق من الأذونات.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
        setIsPaused(false);
        // Resume timer
        let time = recordingTime;
        timerRef.current = setInterval(() => {
          time++;
          setRecordingTime(time);
        }, 1000);
      } else {
        mediaRecorderRef.current.pause();
        setIsPaused(true);
        if (timerRef.current) clearInterval(timerRef.current);
      }
    }
  };

  const resetRecording = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
    setPlaybackTime(0);
    setIsPlaying(false);
    setAudioLevel(Array(20).fill(0));
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  };

  const togglePlayback = () => {
    if (!audioRef.current && audioUrl) {
      audioRef.current = new Audio(audioUrl);
      audioRef.current.onended = () => setIsPlaying(false);
      audioRef.current.ontimeupdate = () => {
        if (audioRef.current) setPlaybackTime(audioRef.current.currentTime);
      };
    }

    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const handleSend = async () => {
    if (!audioBlob) return;
    setIsSending(true);
    await onSend(audioBlob, recordingTime);
    setIsSending(false);
    resetRecording();
    onCancel();
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  // Recording state
  if (isRecording || audioBlob) {
    return (
      <div className="flex items-center gap-3 bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-950/30 dark:to-cyan-950/30 rounded-full px-4 py-2 border border-teal-200 dark:border-teal-800/50">
        {/* Audio Waveform */}
        <div className="flex items-center gap-0.5 h-8">
          {audioLevel.map((level, i) => (
            <div
              key={i}
              className={`w-1 rounded-full transition-all duration-100 ${
                isRecording && !isPaused
                  ? "bg-teal-500 animate-pulse"
                  : "bg-teal-300 dark:bg-teal-700"
              }`}
              style={{
                height: `${Math.max(4, level * 32)}px`,
                opacity: isRecording && !isPaused ? 1 : 0.5,
              }}
            />
          ))}
        </div>

        {/* Timer */}
        <span className={`text-sm font-mono font-medium min-w-[48px] ${
          isRecording && !isPaused ? "text-red-500 animate-pulse" : "text-teal-700 dark:text-teal-300"
        }`}>
          {formatDuration(Math.floor(isRecording ? recordingTime : playbackTime))}
        </span>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {isRecording ? (
            <>
              <button
                onClick={isPaused ? startRecording : pauseRecording}
                className="p-2 rounded-full hover:bg-teal-100 dark:hover:bg-teal-900/50 transition-colors"
                title={isPaused ? "استئناف" : "إيقاف مؤقت"}
              >
                {isPaused ? (
                  <Play size={16} className="text-teal-600 dark:text-teal-400" />
                ) : (
                  <Pause size={16} className="text-amber-600 dark:text-amber-400" />
                )}
              </button>
              <button
                onClick={stopRecording}
                className="p-2 rounded-full bg-red-500 hover:bg-red-600 text-white transition-colors"
                title="إيقاف التسجيل"
              >
                <Square size={14} fill="currentColor" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={togglePlayback}
                className="p-2 rounded-full hover:bg-teal-100 dark:hover:bg-teal-900/50 transition-colors"
                title={isPlaying ? "إيقاف" : "تشغيل"}
              >
                {isPlaying ? (
                  <Pause size={16} className="text-teal-600 dark:text-teal-400" />
                ) : (
                  <Play size={16} className="text-teal-600 dark:text-teal-400" />
                )}
              </button>
              <button
                onClick={resetRecording}
                className="p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                title="حذف"
              >
                <Trash2 size={16} className="text-red-500" />
              </button>
              <button
                onClick={handleSend}
                disabled={isSending}
                className="p-2 rounded-full bg-teal-500 hover:bg-teal-600 text-white transition-colors disabled:opacity-50"
                title="إرسال"
              >
                {isSending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // Initial state - just the mic button
  return (
    <button
      onClick={startRecording}
      className="p-2.5 rounded-full hover:bg-teal-50 dark:hover:bg-teal-950/30 transition-all duration-200 group"
      title="تسجيل رسالة صوتية"
    >
      <Mic
        size={20}
        className="text-slate-500 group-hover:text-teal-600 dark:text-slate-400 dark:group-hover:text-teal-400 transition-colors"
      />
    </button>
  );
}