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
  Shield,
  ScanFace,
  UserCheck,
} from "lucide-react";

export default function DoctorVerificationPage() {
  const router = useRouter();
  const videoRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [cameraStarted, setCameraStarted] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [modelsLoaded, setModelsLoaded] = useState(false);

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
        setMessage("Impossible de charger les modèles IA.");
        setLoading(false);
      }
    };
    loadModels();
  }, []);

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
      setMessage("Accès caméra refusé.");
    }
  };

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
        setMessage("Aucun visage détecté. Veuillez centrer votre visage.");
        setVerifying(false);
        setScanProgress(0);
        return;
      }

      const descriptor = Array.from(detection.descriptor);

      const response = await fetch("/api/doctor/face-verification", {
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
        setMessage("Réponse serveur invalide");
        console.log(error);
        setVerifying(false);
        setScanProgress(0);
        return;
      }

      if (!data.success) {
        setMessage(data.message || "Échec de la vérification.");
        setVerifying(false);
        setScanProgress(0);
        return;
      }

      setSuccess(true);
      setMessage("Visage vérifié avec succès.");

      // FIXED: Redirect to doctor-dashboard instead of waiting-approval
      setTimeout(() => {
        router.push("/doctor-dashboard");
      }, 1500);
    } catch (error) {
      console.error(error);
      setMessage("Erreur de vérification.");
      setScanProgress(0);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f9ff] flex items-center justify-center px-4 py-6">
      <div className="w-full max-w-[380px] bg-white rounded-[24px] shadow-xl border border-slate-100 overflow-hidden mx-auto">
        <div className="px-6 pt-6 pb-3 text-center">
          <div className="mx-auto w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center mb-3">
            <Shield className="w-6 h-6 text-teal-600" />
          </div>
          <h1 className="text-[22px] leading-tight font-bold text-slate-800">
            Vérification Faciale
          </h1>
          <p className="text-sm text-slate-500 mt-1.5 px-2 leading-relaxed">
            Vérifiez votre identité en toute sécurité
          </p>
        </div>

        <div className="px-5">
          <div className="relative rounded-[20px] overflow-hidden border-2 border-teal-200 bg-slate-100 h-[320px]">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
            />

            {!cameraStarted && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50">
                <div className="w-16 h-16 rounded-full bg-teal-50 flex items-center justify-center mb-3">
                  <ScanFace className="w-8 h-8 text-teal-500" />
                </div>
                <p className="text-sm text-slate-500 font-medium">
                  Caméra désactivée
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Activez la caméra pour commencer
                </p>
              </div>
            )}

            {cameraStarted && !success && (
              <>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="relative w-[180px] h-[230px]">
                    <div className="absolute inset-0 border-2 border-teal-400/60 rounded-[50%]" />
                    <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-teal-500 rounded-tl-lg" />
                    <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-teal-500 rounded-tr-lg" />
                    <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-teal-500 rounded-bl-lg" />
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-teal-500 rounded-br-lg" />
                  </div>
                </div>

                <motion.div
                  animate={{ top: ["15%", "85%", "15%"] }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  className="absolute left-8 right-8 h-[2px] bg-teal-400 rounded-full shadow-[0_0_10px_rgba(20,184,166,0.5)]"
                />

                <div className="absolute bottom-3 left-0 right-0 text-center">
                  <p className="text-xs text-white/80 bg-black/30 inline-block px-3 py-1 rounded-full backdrop-blur-sm">
                    Centrez votre visage dans le cadre
                  </p>
                </div>
              </>
            )}

            {success && (
              <div className="absolute inset-0 bg-teal-500/20 flex items-center justify-center backdrop-blur-sm">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                >
                  <CheckCircle2 className="w-14 h-14 text-teal-600" />
                </motion.div>
              </div>
            )}
          </div>
        </div>

        <div className="p-5 space-y-3">
          <AnimatePresence>
            {message && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`p-3 rounded-lg text-sm flex items-center gap-2 ${
                  success
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-red-50 text-red-600 border border-red-200"
                }`}
              >
                {success ? (
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                )}
                <span className="font-medium">{message}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {verifying && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-slate-500 font-medium">
                <span>Analyse en cours...</span>
                <span>{scanProgress}%</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-teal-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${scanProgress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          )}

          {!loading && !cameraStarted && (
            <button
              onClick={startCamera}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-200 shadow-lg shadow-teal-500/20 hover:shadow-teal-500/30 hover:-translate-y-0.5"
            >
              <Camera className="w-5 h-5" />
              Démarrer la caméra
            </button>
          )}

          {!loading && cameraStarted && !success && (
            <button
              onClick={handleVerification}
              disabled={verifying || !modelsLoaded}
              className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-60 disabled:hover:translate-y-0 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-200 shadow-lg shadow-teal-500/20 hover:shadow-teal-500/30 hover:-translate-y-0.5"
            >
              {verifying ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyse en cours...
                </>
              ) : (
                <>
                  <UserCheck className="w-5 h-5" />
                  Lancer la vérification
                </>
              )}
            </button>
          )}

          {success && (
            <div className="w-full bg-emerald-50 text-emerald-700 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 border border-emerald-200">
              <CheckCircle2 className="w-5 h-5" />
              Vérifié avec succès
            </div>
          )}

          <p className="text-center text-xs text-slate-400 mt-2">
            Regardez la caméra et restez immobile pendant 3 secondes.
          </p>
        </div>
      </div>
    </div>
  );
}