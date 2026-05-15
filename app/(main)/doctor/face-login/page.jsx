"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as faceapi from "face-api.js";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  ScanFace,
  Camera,
  Loader2,
  AlertCircle,
  Fingerprint,
  ScanLine,
  Shield,
} from "lucide-react";

export default function FaceLoginPage() {
  const router = useRouter();
  const videoRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [cameraStarted, setCameraStarted] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  // =========================
  // LOAD MODELS
  // =========================
  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    try {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
        faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
        faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
      ]);
      setLoading(false);
    } catch (error) {
      console.error(error);
      setMessage("Failed to load AI models. Please refresh the page.");
    }
  };

  // =========================
  // START CAMERA
  // =========================
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: 1280,
          height: 720,
          facingMode: "user",
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setCameraStarted(true);
      setMessage("");
    } catch (error) {
      console.error(error);
      setMessage("Cannot access camera. Please allow camera permissions.");
    }
  };

  // =========================
  // VERIFY FACE
  // =========================
  const verifyFace = async () => {
    try {
      setVerifying(true);
      setMessage("");
      setScanProgress(0);

      if (!videoRef.current) {
        setMessage("Camera not ready");
        setVerifying(false);
        return;
      }

      // Animate scan progress
      const progressInterval = setInterval(() => {
        setScanProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // wait little
      await new Promise((resolve) => setTimeout(resolve, 1200));

      const detection = await faceapi
        .detectSingleFace(
          videoRef.current,
          new faceapi.TinyFaceDetectorOptions({
            inputSize: 512,
            scoreThreshold: 0.3,
          })
        )
        .withFaceLandmarks()
        .withFaceDescriptor();

      clearInterval(progressInterval);
      setScanProgress(100);

      if (!detection) {
        setMessage("No face detected. Please center your face in the frame.");
        setVerifying(false);
        setScanProgress(0);
        return;
      }

      const descriptor = Array.from(detection.descriptor);

      const response = await fetch(
        "/api/doctor/face-verification/face-login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            descriptor,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || "Verification failed. Please try again.");
        setVerifying(false);
        setScanProgress(0);
        return;
      }

      // SESSION
      sessionStorage.setItem("doctor_face_verified", "true");

      setSuccess(true);
      setMessage("Face verified successfully! Redirecting...");
      setScanProgress(100);

      setTimeout(() => {
        router.push("/doctor-dashboard");
      }, 1800);
    } catch (error) {
      console.error(error);
      setMessage("Verification failed. Please try again.");
      setScanProgress(0);
    } finally {
      setVerifying(false);
    }
  };

  // =========================
  // UI
  // =========================

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f0fdfa] via-[#f8fafc] to-white flex items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-teal-100/40 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-cyan-100/30 rounded-full blur-3xl" />
        <div className="absolute top-[20%] right-[20%] w-[300px] h-[300px] bg-teal-50/50 rounded-full blur-2xl" />
      </div>

      <div className="w-full max-w-[380px] flex flex-col items-center relative z-10">
        
        {/* Title - Minimal */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-6"
        >
          <h1 className="text-[#0f766e] text-[24px] font-bold tracking-tight mb-1">
            Doctor Face Verification
          </h1>
          <p className="text-slate-500 text-sm leading-relaxed">
            Securely verify your identity before accessing your dashboard
          </p>
        </motion.div>

        {/* Camera Section - No Card, Direct on Background */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="relative w-full aspect-[4/5] bg-white/60 backdrop-blur-xl rounded-[32px] border border-white/50 shadow-[0_8px_40px_-12px_rgba(13,148,136,0.12)] overflow-hidden"
        >
          {/* Video Element */}
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            onLoadedMetadata={() => {
              videoRef.current?.play();
            }}
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* Placeholder when camera is off */}
          {!cameraStarted && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-white/40 to-white/60 backdrop-blur-sm">
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="w-20 h-20 rounded-full bg-teal-50/80 flex items-center justify-center mb-4 border border-teal-100"
              >
                <ScanFace className="w-8 h-8 text-teal-500" />
              </motion.div>
              <p className="text-slate-500 text-sm font-medium">
                Camera is off
              </p>
              <p className="text-slate-400 text-xs mt-1">
                Click below to start
              </p>
            </div>
          )}

          {/* Face Scan Frame Overlay */}
          {cameraStarted && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {/* Outer glow */}
              <div className="absolute w-[200px] h-[260px] rounded-[40px] bg-teal-400/10 blur-xl" />
              
              {/* Main frame */}
              <div className="relative w-[180px] h-[240px] rounded-[36px] border-[3px] border-teal-400 shadow-[0_0_30px_rgba(20,184,166,0.3)] overflow-hidden">
                {/* Corner accents */}
                <div className="absolute top-0 left-0 w-6 h-6 border-t-[3px] border-l-[3px] border-teal-500 rounded-tl-[24px]" />
                <div className="absolute top-0 right-0 w-6 h-6 border-t-[3px] border-r-[3px] border-teal-500 rounded-tr-[24px]" />
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-[3px] border-l-[3px] border-teal-500 rounded-bl-[24px]" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-[3px] border-r-[3px] border-teal-500 rounded-br-[24px]" />
                
                {/* Scan line animation */}
                <motion.div
                  animate={{ top: ["0%", "100%", "0%"] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-teal-400 to-transparent shadow-[0_0_10px_rgba(20,184,166,0.8)]"
                />
                
                {/* Scanning dots */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-2 h-2 rounded-full bg-teal-400 shadow-[0_0_10px_rgba(20,184,166,0.8)]"
                  />
                </div>
              </div>

              {/* Face position guides */}
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/40 backdrop-blur-md rounded-full px-4 py-2">
                <ScanLine className="w-3 h-3 text-teal-300" />
                <span className="text-white/90 text-xs font-medium">
                  Position your face in the frame
                </span>
              </div>
            </div>
          )}

          {/* Success Overlay */}
          <AnimatePresence>
            {success && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-teal-500/20 backdrop-blur-sm flex items-center justify-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-2xl"
                >
                  <CheckCircle2 className="w-10 h-10 text-teal-500" />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Loading Overlay */}
          {loading && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center">
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-4 border-teal-100 border-t-teal-500 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Fingerprint className="w-5 h-5 text-teal-600" />
                </div>
              </div>
              <p className="text-slate-600 text-sm font-medium mt-4">
                Loading AI Models...
              </p>
            </div>
          )}
        </motion.div>

        {/* Content Section - Below Camera, No Card */}
        <div className="w-full mt-6 space-y-4">
          
          {/* Status Message */}
          <AnimatePresence mode="wait">
            {message && (
              <motion.div
                initial={{ opacity: 0, y: 10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                className={`rounded-2xl px-4 py-3 flex items-start gap-3 ${
                  success
                    ? "bg-emerald-50/80 border border-emerald-200/50 backdrop-blur-sm"
                    : "bg-red-50/80 border border-red-200/50 backdrop-blur-sm"
                }`}
              >
                {success ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
                )}
                <p className={`text-sm font-medium leading-relaxed ${
                  success ? "text-emerald-700" : "text-red-600"
                }`}>
                  {message}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Progress Bar (during verification) */}
          <AnimatePresence>
            {verifying && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2"
              >
                <div className="flex justify-between text-xs text-slate-500 font-medium">
                  <span>Scanning face...</span>
                  <span>{scanProgress}%</span>
                </div>
                <div className="h-2 bg-slate-100/80 rounded-full overflow-hidden backdrop-blur-sm">
                  <motion.div
                    className="h-full bg-gradient-to-r from-teal-400 to-teal-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${scanProgress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Button */}
          <div className="space-y-3">
            {!loading && !cameraStarted && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={startCamera}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-semibold text-sm shadow-lg shadow-teal-500/25 transition-all duration-300 flex items-center justify-center gap-2"
              >
                <Camera className="w-4 h-4" />
                Start Camera
              </motion.button>
            )}

            {!loading && cameraStarted && !success && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={verifyFace}
                disabled={verifying}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 disabled:from-slate-300 disabled:to-slate-400 text-white font-semibold text-sm shadow-lg shadow-teal-500/25 transition-all duration-300 flex items-center justify-center gap-2 disabled:shadow-none"
              >
                {verifying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4" />
                    Start Verification
                  </>
                )}
              </motion.button>
            )}

            {success && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-full py-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/50 backdrop-blur-sm text-emerald-700 font-semibold text-sm flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                Verified Successfully
              </motion.div>
            )}
          </div>

          {/* Helper Text */}
          {!success && (
            <p className="text-center text-slate-400 text-xs leading-relaxed">
              Please look into the camera and hold still for 3 seconds.
              <br />
              Ensure good lighting for best results.
            </p>
          )}
        </div>

        {/* Footer Trust Badge */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-6 flex items-center gap-2 text-slate-400 text-xs"
        >
          <Shield className="w-3 h-3" />
          <span>End-to-end encrypted • HIPAA compliant</span>
        </motion.div>
      </div>
    </div>
  );
}