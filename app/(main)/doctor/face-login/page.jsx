

"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import * as faceapi from "face-api.js";

import { motion } from "framer-motion";

import {
  CheckCircle2,
  ShieldAlert,
  ScanFace,
} from "lucide-react";

export default function FaceLoginPage() {

  const router = useRouter();

  const videoRef = useRef(null);

  const [loading, setLoading] =
    useState(true);

  const [cameraStarted, setCameraStarted] =
    useState(false);

  const [verifying, setVerifying] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [success, setSuccess] =
    useState(false);

  // =========================
  // LOAD MODELS
  // =========================
  useEffect(() => {

    loadModels();

  }, []);

  const loadModels = async () => {

    try {

      await Promise.all([

        faceapi
          .nets
          .tinyFaceDetector
          .loadFromUri("/models"),

        faceapi
          .nets
          .faceLandmark68Net
          .loadFromUri("/models"),

        faceapi
          .nets
          .faceRecognitionNet
          .loadFromUri("/models"),

      ]);

      setLoading(false);

    } catch (error) {

      console.error(error);

      setMessage(
        "Failed to load AI models"
      );
    }
  };

  // =========================
  // START CAMERA
  // =========================
  const startCamera = async () => {

    try {

      const stream =
        await navigator
          .mediaDevices
          .getUserMedia({
            video: {
              width: 1280,
              height: 720,
              facingMode: "user",
            },
          });

      if (videoRef.current) {

        videoRef.current.srcObject =
          stream;
      }

      setCameraStarted(true);

    } catch (error) {

      console.error(error);

      alert("Cannot access camera");
    }
  };

  // =========================
  // VERIFY FACE
  // =========================
  const verifyFace = async () => {

    try {

      setVerifying(true);

      setMessage("");

      if (!videoRef.current) {

        setMessage("Camera not ready");

        setVerifying(false);

        return;
      }

      // wait little
      await new Promise((resolve) =>
        setTimeout(resolve, 1200)
      );

      const detection =
        await faceapi
          .detectSingleFace(
            videoRef.current,
            new faceapi
              .TinyFaceDetectorOptions({
                inputSize: 512,
                scoreThreshold: 0.3,
              })
          )
          .withFaceLandmarks()
          .withFaceDescriptor();

      if (!detection) {

        setMessage(
          "No face detected"
        );

        setVerifying(false);

        return;
      }

      const descriptor =
        Array.from(
          detection.descriptor
        );

      const response =
        await fetch(
          "/api/doctor/face-verification/face-login",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              descriptor,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {

        setMessage(
          data.error ||
          "Verification failed"
        );

        setVerifying(false);

        return;
      }

sessionStorage.setItem(
  "doctor_face_verified",
  "true"
);

      setSuccess(true);

      setMessage(
        "Biometric identity confirmed"
      );

      setTimeout(() => {

        router.push(
          "/doctor-dashboard"
        );

      }, 1800);

    } catch (error) {

      console.error(error);

      setMessage(
        "Verification failed"
      );

    } finally {

      setVerifying(false);
    }
  };

  // =========================
  // UI
  // =========================
  return (

    <div className="min-h-screen bg-black overflow-hidden relative flex items-center justify-center px-6">

      {/* GRID */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />

      {/* BACKGROUND GLOW */}
      <div className="absolute inset-0 overflow-hidden">

        <div className="absolute top-[-200px] left-[-200px] w-[500px] h-[500px] bg-cyan-500/20 blur-[140px] rounded-full" />

        <div className="absolute bottom-[-200px] right-[-200px] w-[500px] h-[500px] bg-blue-500/20 blur-[140px] rounded-full" />

      </div>

      {/* CARD */}
      <motion.div
        initial={{
          opacity: 0,
          y: 40,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.6,
        }}
        className="relative z-10 w-full max-w-md rounded-[36px] border border-white/10 bg-white/5 backdrop-blur-2xl shadow-[0_0_80px_rgba(0,255,255,0.08)] overflow-hidden"
      >

        {/* HEADER */}
        <div className="p-8 text-center border-b border-white/10">

          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-cyan-500/10 border border-cyan-400/20">

            <ScanFace
              size={42}
              className="text-cyan-400"
            />

          </div>

          <h1 className="text-4xl font-bold text-white">
            Face Verification
          </h1>

          <p className="mt-3 text-zinc-400 text-sm leading-relaxed">
            Secure biometric authentication
            for medical dashboard access
          </p>

        </div>

        {/* AI STATUS */}
        <div className="flex items-center justify-center gap-2 py-4 text-cyan-400 text-sm font-medium">

          <div className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />

          AI Face Recognition Active

        </div>

        {/* CAMERA */}
        <div className="p-6">

          <div className="relative overflow-hidden rounded-[28px] border border-cyan-500/20 bg-black">

            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              onLoadedMetadata={() => {
                videoRef.current?.play();
              }}
              className="h-[460px] w-full object-cover"
            />

            {/* FACE FRAME */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">

              <motion.div
                animate={{
                  opacity: [0.6, 1, 0.6],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 2,
                }}
                className="w-[240px] h-[300px] rounded-[40px] border-[4px] border-cyan-400 shadow-[0_0_40px_rgba(0,255,255,0.7)]"
              />

            </div>

            {/* SCAN LINE */}
            <motion.div
              animate={{
                y: [-160, 160],
              }}
              transition={{
                repeat: Infinity,
                duration: 2.4,
                ease: "linear",
              }}
              className="absolute left-0 right-0 mx-auto h-[3px] w-[260px] bg-cyan-400 blur-[1px]"
            />

          </div>

        </div>

        {/* ACTIONS */}
        <div className="px-6 pb-8 text-center">

          {loading && (

            <p className="text-yellow-400 animate-pulse mb-5">

              Loading AI Models...

            </p>
          )}

          {!loading &&
            !cameraStarted && (

            <button
              onClick={startCamera}
              className="w-full rounded-2xl bg-cyan-500 hover:bg-cyan-400 transition-all duration-300 py-4 text-lg font-bold text-white shadow-[0_0_25px_rgba(0,255,255,0.5)]"
            >

              Start Camera

            </button>
          )}

          {!loading &&
            cameraStarted &&
            !success && (

            <button
              onClick={verifyFace}
              disabled={verifying}
              className="w-full rounded-2xl bg-white hover:bg-zinc-200 transition-all duration-300 py-4 text-lg font-bold text-black"
            >

              {verifying
                ? "Analyzing Biometric Identity..."
                : "Verify Face"}

            </button>
          )}

          {/* MESSAGE */}
          {message && (

            <motion.div
              initial={{
                opacity: 0,
                y: 10,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              className="mt-6"
            >

              {success ? (

                <div className="flex items-center justify-center gap-2 text-green-400 font-medium">

                  <CheckCircle2 size={22} />

                  <span>
                    {message}
                  </span>

                </div>

              ) : (

                <div className="flex items-center justify-center gap-2 text-red-400 font-medium">

                  <ShieldAlert size={22} />

                  <span>
                    {message}
                  </span>

                </div>

              )}

            </motion.div>
          )}

        </div>

      </motion.div>

    </div>
  );
}

