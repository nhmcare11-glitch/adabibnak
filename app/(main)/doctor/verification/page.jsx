"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import * as faceapi from "face-api.js";

export default function DoctorVerificationPage() {

  const router = useRouter();

  const videoRef = useRef(null);

  const [loading, setLoading] =
    useState(false);

  const [modelsLoaded, setModelsLoaded] =
    useState(false);

  const [message, setMessage] =
    useState("");

  // =========================
  // LOAD FACE MODELS
  // =========================
  useEffect(() => {

    const loadModels = async () => {

      try {

        await faceapi
          .nets
          .tinyFaceDetector
          .loadFromUri("/models");

        await faceapi
          .nets
          .faceLandmark68Net
          .loadFromUri("/models");

        await faceapi
          .nets
          .faceRecognitionNet
          .loadFromUri("/models");

        setModelsLoaded(true);

      } catch (error) {

        console.error(error);

        setMessage(
          "Failed to load AI models"
        );
      }
    };

    loadModels();

  }, []);

  // =========================
  // START CAMERA
  // =========================
  useEffect(() => {

    if (!modelsLoaded) return;

    startCamera();

  }, [modelsLoaded]);

  const startCamera = async () => {

    try {

      const stream =
        await navigator.mediaDevices
          .getUserMedia({
            video: true,
          });

      if (videoRef.current) {

        videoRef.current.srcObject =
          stream;
      }

    } catch (error) {

      console.error(error);

      setMessage(
        "Camera access denied"
      );
    }
  };

  // =========================
  // FACE ENROLLMENT
  // =========================
  const handleVerification =
    async () => {

      try {

        setLoading(true);

        setMessage("");

        const detection =
          await faceapi
            .detectSingleFace(
              videoRef.current,
              new faceapi
                .TinyFaceDetectorOptions()
            )
            .withFaceLandmarks()
            .withFaceDescriptor();

        // لا يوجد وجه
        if (!detection) {

          setMessage(
            "No face detected"
          );

          setLoading(false);

          return;
        }

        // descriptor
        const descriptor =
          Array.from(
            detection.descriptor
          );

        // إرسال للـ API
        const response =
          await fetch(
            "/api/doctor/face-verification",
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


const rawText = await response.text();

console.log("RAW RESPONSE:", rawText);

let data;

try {
  data = JSON.parse(rawText);
} catch (error) {
  setMessage("Invalid server response");
  console.log(error);
  return;
}



        // فشل
        if (!data.success) {

          setMessage(
            data.message ||
            "Verification failed"
          );

          setLoading(false);

          return;
        }

        // نجاح
        setMessage(
          "Face enrolled successfully"
        );

        // انتظار بسيط
        setTimeout(() => {

          router.push(
            "/waiting-approval"
          );

        }, 1500);

      } catch (error) {

        console.error(error);

        setMessage(
          "Verification error"
        );

      } finally {

        setLoading(false);
      }
    };

  return (

    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">

      <h1 className="text-5xl font-bold mb-10 text-center">
        Doctor Face Verification
      </h1>

      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="w-full max-w-2xl rounded-3xl border border-white/10"
      />

      <p className="mt-6 text-lg text-red-400">
        {message}
      </p>

      <button
        onClick={handleVerification}
        disabled={
          loading ||
          !modelsLoaded
        }
        className="mt-6 px-8 py-4 rounded-2xl bg-white text-black font-bold text-lg"
      >

        {loading
          ? "Processing..."
          : "Verify Face"}

      </button>

    </div>
  );
}