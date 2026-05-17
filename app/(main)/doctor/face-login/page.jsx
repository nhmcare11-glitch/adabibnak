"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as faceapi from "face-api.js";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  Camera,
  Loader2,
  AlertCircle,
  ScanFace,
} from "lucide-react";

export default function DoctorFaceLoginPage() {
  const router = useRouter();
  const videoRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [cameraStarted, setCameraStarted] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [modelsLoaded, setModelsLoaded] = useState(false);

  // =========================
  // LOAD FACE MODELS
  // =========================
  useEffect(() => {
    const loadModels = async () => {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
          faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
          faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
        ]);
        setModelsLoaded(true);
        setLoading(false);
      } catch (error) {
        console.error(error);
        setMessage("Failed to load AI models");
        setLoading(false);
      }
    };
    loadModels();
  }, []);

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
      setMessage("Camera access denied");
    }
  };

  // =========================
  // FACE VERIFICATION (Compare with saved face)
  // =========================
  const handleVerification = async () => {
    try {
      setVerifying(true);
      setMessage("");
      setScanProgress(0);

      const interval = setInterval(() => {
        setScanProgress((prev) => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 10;
        });
      }, 180);

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

      clearInterval(interval);
      setScanProgress(100);

      if (!detection) {
        setMessage("No face detected. Please center your face.");
        setVerifying(false);
        setScanProgress(0);
        return;
      }

      const descriptor = Array.from(detection.descriptor);

      // ✅ استدعاء API التحقق (face-login) وليس التسجيل
      const response = await fetch("/api/doctor/face-verification/face-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ descriptor }),
      });

      const rawText = await response.text();
      console.log("RAW RESPONSE:", rawText);

      let data;
      try {
        data = JSON.parse(rawText);
      } catch (error) {
        setMessage("Invalid server response");
        console.log(error);
        setVerifying(false);
        setScanProgress(0);
        return;
      }

      if (!data.success) {
        setMessage(data.error || "Face does not match. Please try again.");
        setVerifying(false);
        setScanProgress(0);
        return;
      }

      // ✅ نجاح التحقق
      setSuccess(true);
      setMessage("Face verified successfully!");

      // ✅ حفظ حالة التحقق في sessionStorage
      sessionStorage.setItem("doctor_face_verified", "true");

      // ✅ الانتقال إلى الداشبورد
      setTimeout(() => {
        router.push("/doctor-dashboard");
      }, 1500);
    } catch (error) {
      console.error(error);
      setMessage("Verification error");
      setScanProgress(0);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f7ff] flex flex-col items-center justify-center px-4 py-8">

      <div className="text-center mb-6">
        <h1 className="text-[28px] font-bold text-teal-700 tracking-tight">
          Doctor Face Login
        </h1>
        <p className="text-sm text-slate-500 mt-2 max-w-[320px] mx-auto leading-relaxed">
          Verify your identity to access your dashboard.
        </p>
      </div>

      <div className="w-full max-w-[340px] bg-white rounded-[20px] shadow-[0_4px_20px_rgba(0,0,0,0.06)] border border-slate-100 overflow-hidden p-6">

        <div className="relative w-full aspect-[3/4] max-h-[320px] mb-5">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-[240px] h-[300px] rounded-[50%] overflow-hidden bg-slate-100 border-2 border-teal-300/40">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
              />

              {!cameraStarted && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50">
                  <ScanFace className="w-12 h-12 text-teal-400/60 mb-2" />
                  <p className="text-xs text-slate-400">Camera off</p>
                </div>
              )}

              {cameraStarted && !success && (
                <>
                  <motion.div
                    animate={{ top: ["10%", "90%", "10%"] }}
                    transition={{
                      duration: 2.5,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="absolute left-2 right-2 h-[2px] bg-teal-400/60 rounded-full"
                  />
                </>
              )}

              {success && (
                <div className="absolute inset-0 bg-teal-500/10 flex items-center justify-center">
                  <CheckCircle2 className="w-12 h-12 text-teal-600" />
                </div>
              )}
            </div>
          </div>
        </div>

        <AnimatePresence>
          {message && !success && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-100 mb-4"
            >
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <span className="text-sm text-red-600 font-medium">{message}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {verifying && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-slate-500 mb-1.5">
              <span>Processing...</span>
              <span>{scanProgress}%</span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-teal-600 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${scanProgress}%` }}
                transition={{ duration: 0.2 }}
              />
            </div>
          </div>
        )}

        {!loading && !cameraStarted && (
          <button
            onClick={startCamera}
            className="w-full bg-teal-700 hover:bg-teal-800 text-white py-3.5 rounded-full font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200 shadow-md shadow-teal-700/20 hover:shadow-lg hover:shadow-teal-700/30"
          >
            <Camera className="w-4 h-4" />
            Start Camera
          </button>
        )}

        {!loading && cameraStarted && !success && (
          <button
            onClick={handleVerification}
            disabled={verifying || !modelsLoaded}
            className="w-full bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white py-3.5 rounded-full font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200 shadow-md shadow-teal-700/20"
          >
            {verifying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <ScanFace className="w-4 h-4" />
                Verify Face
              </>
            )}
          </button>
        )}

        {success && (
          <div className="w-full bg-emerald-50 text-emerald-700 py-3.5 rounded-full font-semibold text-sm flex items-center justify-center gap-2 border border-emerald-200">
            <CheckCircle2 className="w-4 h-4" />
            Verified Successfully
          </div>
        )}

        <p className="text-center text-[11px] text-slate-400 mt-4">
          Please look into the camera and hold still for 3 seconds.
        </p>
      </div>
    </div>
  );
}