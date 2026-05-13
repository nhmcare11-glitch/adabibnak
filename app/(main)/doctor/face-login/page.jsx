"use client";

import { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, CheckCircle2, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function FaceLoginPage() {
  const videoRef = useRef(null);

  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [failed, setFailed] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    loadModels();
    startCamera();

    return () => {
      stopCamera();
    };
  }, []);

  const loadModels = async () => {
    const MODEL_URL = "/models";

    await faceapi.nets.tinyFaceDetector.loadFromUri(
      MODEL_URL
    );

    await faceapi.nets.faceLandmark68Net.loadFromUri(
      MODEL_URL
    );

    await faceapi.nets.faceRecognitionNet.loadFromUri(
      MODEL_URL
    );

    setModelsLoaded(true);
  };

  const startCamera = async () => {
    try {
      const stream =
        await navigator.mediaDevices.getUserMedia({
          video: true,
        });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.log(error);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks =
        videoRef.current.srcObject.getTracks();

      tracks.forEach((track) => track.stop());
    }
  };

  const verifyFace = async () => {
    try {
      setLoading(true);
      setFailed(false);

      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return 90;
          return prev + 10;
        });
      }, 150);

      const detection =
        await faceapi
          .detectSingleFace(
            videoRef.current,
            new faceapi.TinyFaceDetectorOptions()
          )
          .withFaceLandmarks()
          .withFaceDescriptor();

      if (!detection) {
        clearInterval(interval);

        setLoading(false);

        alert("No face detected");

        return;
      }

      const currentDescriptor =
        Array.from(detection.descriptor);

      const response = await fetch(
        "/api/doctor/face-verification/face-login",
        {
          method: "POST",
        }
      );

      const data = await response.json();

      clearInterval(interval);

      if (!data.success) {
        setLoading(false);
        alert(data.message);

        return;
      }

      const savedDescriptor =
        data.descriptor;

      const distance =
        faceapi.euclideanDistance(
          currentDescriptor,
          savedDescriptor
        );

      setProgress(100);

      // كلما كان أصغر كان أفضل
      if (distance < 0.5) {
        setVerified(true);

        setTimeout(() => {
          router.push("/doctor-dashboard");
        }, 2500);
      } else {
        setFailed(true);
      }

      setLoading(false);
    } catch (error) {
      console.log(error);

      setLoading(false);

      alert("Verification failed");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#dff7f2] via-[#eefcf8] to-[#d8f1eb] flex items-center justify-center p-6">
      <motion.div
        initial={{
          opacity: 0,
          scale: 0.9,
        }}
        animate={{
          opacity: 1,
          scale: 1,
        }}
        className="w-full max-w-md"
      >
        <div className="bg-white/70 backdrop-blur-2xl rounded-[40px] shadow-2xl border border-white/40 overflow-hidden p-8">
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg mb-5">
              <ShieldCheck className="text-white w-10 h-10" />
            </div>

            <h1 className="text-3xl font-bold text-gray-800">
              Face Recognition
            </h1>

            <p className="text-gray-500 mt-3">
              Secure biometric verification
            </p>
          </div>

          <div className="mt-8 relative">
            <div className="relative rounded-[32px] overflow-hidden border-[6px] border-emerald-300 shadow-xl bg-black">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-[420px] object-cover"
              />

              {loading && (
                <motion.div
                  initial={{ y: -300 }}
                  animate={{ y: 320 }}
                  transition={{
                    repeat: Infinity,
                    duration: 1.8,
                    ease: "linear",
                  }}
                  className="absolute left-0 right-0 h-1 bg-emerald-400"
                />
              )}
            </div>
          </div>

          <div className="mt-7">
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
              <motion.div
                animate={{
                  width: `${progress}%`,
                }}
                className="h-full bg-gradient-to-r from-emerald-400 to-teal-500"
              />
            </div>

            <div className="mt-2 text-center text-sm text-gray-500">
              {loading
                ? "Analyzing face..."
                : modelsLoaded
                ? "Ready"
                : "Loading AI models..."}
            </div>
          </div>

          <button
            onClick={verifyFace}
            disabled={!modelsLoaded || loading}
            className="w-full mt-8 h-16 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-500 text-white text-xl font-semibold shadow-lg"
          >
            {loading
              ? "Verifying..."
              : "Verify Face"}
          </button>
        </div>
      </motion.div>

      <AnimatePresence>
        {verified && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50"
          >
            <motion.div
              initial={{
                scale: 0.7,
                opacity: 0,
              }}
              animate={{
                scale: 1,
                opacity: 1,
              }}
              className="bg-white rounded-[32px] p-10 text-center shadow-2xl"
            >
              <CheckCircle2 className="w-24 h-24 text-emerald-500 mx-auto" />

              <h2 className="text-3xl font-bold mt-5">
                Verified
              </h2>

              <p className="text-gray-500 mt-3">
                Redirecting to dashboard...
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {failed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50"
          >
            <motion.div
              initial={{
                scale: 0.7,
                opacity: 0,
              }}
              animate={{
                scale: 1,
                opacity: 1,
              }}
              className="bg-white rounded-[32px] p-10 text-center shadow-2xl"
            >
              <XCircle className="w-24 h-24 text-red-500 mx-auto" />

              <h2 className="text-3xl font-bold mt-5 text-red-500">
                Access Denied
              </h2>

              <p className="text-gray-500 mt-3">
                Face does not match
              </p>

              <button
                onClick={() => setFailed(false)}
                className="mt-6 bg-red-500 text-white px-6 py-3 rounded-2xl"
              >
                Try Again
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}