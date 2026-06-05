"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Mic, Square, Play, Pause, Trash2, Send, Loader2 } from "lucide-react";

function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export default function VoiceRecorder({ onSend, onCancel }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [audioLevel, setAudioLevel] = useState(Array(16).fill(0));
  const [error, setError] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const audioRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const animationRef = useRef(null);
  const streamRef = useRef(null);
  const recordingTimeRef = useRef(0);

  const visualizeAudio = useCallback(() => {
    if (!analyserRef.current || !dataArrayRef.current) return;
    const animate = () => {
      if (!analyserRef.current || !dataArrayRef.current) return;
      analyserRef.current.getByteFrequencyData(dataArrayRef.current);
      const bars = Array.from(dataArrayRef.current).slice(0, 16).map(v => v / 255);
      setAudioLevel(bars);
      animationRef.current = requestAnimationFrame(animate);
    };
    animate();
  }, []);

  const startRecording = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      analyserRef.current = analyser;
      dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);

      const mimeTypes = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg", "audio/wav"];
      let selectedMimeType = "audio/webm";
      for (const mime of mimeTypes) { 
        if (MediaRecorder.isTypeSupported(mime)) { 
          selectedMimeType = mime; 
          break; 
        } 
      }

      const mediaRecorder = new MediaRecorder(stream, { mimeType: selectedMimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => { 
        if (event.data.size > 0) audioChunksRef.current.push(event.data); 
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: selectedMimeType });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(track => track.stop());
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
        setAudioLevel(Array(16).fill(0));
      };
      
      mediaRecorder.onerror = (e) => { 
        setError("خطأ في التسجيل"); 
        cleanup(); 
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setIsPaused(false);
      recordingTimeRef.current = 0;
      
      timerRef.current = setInterval(() => { 
        recordingTimeRef.current += 1;
        setRecordingTime(recordingTimeRef.current);
        if (recordingTimeRef.current >= 300) stopRecording(); 
      }, 1000);
      
      visualizeAudio();
    } catch (err) { 
      setError("لا يمكن الوصول إلى الميكروفون"); 
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      try { 
        mediaRecorderRef.current.stop(); 
      } catch (e) {}
      setIsRecording(false);
      setIsPaused(false);
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    }
  };

  const cleanup = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    if (audioUrl) URL.revokeObjectURL(audioUrl);
  };

  const resetRecording = () => {
    cleanup();
    setAudioBlob(null); 
    setAudioUrl(null); 
    setRecordingTime(0); 
    setPlaybackTime(0);
    recordingTimeRef.current = 0;
    setIsPlaying(false); 
    setIsRecording(false); 
    setIsPaused(false);
    setAudioLevel(Array(16).fill(0)); 
    setError(null);
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
        audioRef.current.play().catch(e => console.error("Playback error:", e)); 
        setIsPlaying(true); 
      }
    }
  };

  const handleSend = async () => {
    if (!audioBlob) return;
    setIsSending(true);
    try { 
      await onSend(audioBlob, recordingTime); 
    } catch (err) { 
      console.error("Send voice error:", err); 
    } finally { 
      setIsSending(false); 
      resetRecording(); 
      if (onCancel) onCancel(); 
    }
  };

  useEffect(() => { 
    return () => { 
      cleanup(); 
    }; 
  }, []);

  if (error) {
    return (
      <div className="flex items-center gap-2 bg-red-50 rounded-full px-3 py-1.5 border border-red-100">
        <span className="text-[10px] text-red-500">{error}</span>
        <button onClick={() => { setError(null); resetRecording(); }} className="p-1 rounded-full hover:bg-red-100">
          <Trash2 className="w-3 h-3 text-red-400" />
        </button>
      </div>
    );
  }

  if (isRecording || audioBlob) {
    return (
      <div className="flex items-center gap-2 bg-[#e8f4f4] rounded-full px-3 py-1.5 border border-[#d0e8e8]">
        <div className="flex items-center gap-0.5 h-6">
          {audioLevel.map((level, i) => (
            <div 
              key={i} 
              className={`w-0.5 rounded-full transition-all ${isRecording && !isPaused ? "bg-[#0d7377]" : "bg-[#0d7377]/40"}`} 
              style={{ 
                height: `${Math.max(3, level * 24)}px`, 
                opacity: isRecording && !isPaused ? 1 : 0.5 
              }} 
            />
          ))}
        </div>
        <span className={`text-[10px] font-mono font-medium min-w-[36px] ${isRecording && !isPaused ? "text-red-400" : "text-[#0d5c5c]"}`}>
          {formatDuration(Math.floor(isRecording ? recordingTime : playbackTime))}
        </span>
        <div className="flex items-center gap-1">
          {isRecording ? (
            <>
              <button 
                onClick={isPaused ? startRecording : () => {}} 
                className="p-1 rounded-full hover:bg-[#d0e8e8]"
              >
                {isPaused ? <Play className="w-3 h-3 text-[#0d7377]" /> : <Square className="w-2.5 h-2.5 fill-red-400 text-red-400" />}
              </button>
              <button 
                onClick={stopRecording} 
                className="p-1 rounded-full bg-red-400 hover:bg-red-500 text-white"
              >
                <Square className="w-2.5 h-2.5 fill-current" />
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={togglePlayback} 
                className="p-1 rounded-full hover:bg-[#d0e8e8]"
              >
                {isPlaying ? <Pause className="w-3 h-3 text-[#0d7377]" /> : <Play className="w-3 h-3 text-[#0d7377]" />}
              </button>
              <button 
                onClick={resetRecording} 
                className="p-1 rounded-full hover:bg-red-50"
              >
                <Trash2 className="w-3 h-3 text-red-400" />
              </button>
              <button 
                onClick={handleSend} 
                disabled={isSending} 
                className="p-1 rounded-full bg-[#0d7377] hover:bg-[#0a5c5f] text-white disabled:opacity-50"
              >
                {isSending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <button 
      onClick={startRecording} 
      className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-[#f0f7f7] transition-all group cursor-pointer"
      type="button"
    >
      <Mic className="w-3.5 h-3.5 text-[#6b9e9e] group-hover:text-[#0d7377]" />
    </button>
  );
}