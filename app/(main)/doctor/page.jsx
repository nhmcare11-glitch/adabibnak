"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function DoctorVerificationPage() {

  const videoRef = useRef(null);

  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // تشغيل الكاميرا
  useEffect(() => {

    async function startCamera() {

      try {

        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

      } catch (error) {

        console.error(error);

        setMessage("Camera access denied");
      }
    }

    startCamera();

  }, []);

  // حفظ الوجه
  async function handleSaveFace() {

    try {

      setLoading(true);

      setMessage("");

      const response = await fetch(
        "/api/doctor/face-verification",
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (!response.ok) {

        setMessage(data.error || "Verification failed");

        return;
      }

      setMessage("Face saved successfully");

      // تحويل لصفحة face login
      setTimeout(() => {

        router.push("/doctor/face-login");

      }, 1500);

    } catch (error) {

      console.error(error);

      setMessage("Something went wrong");

    } finally {

      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-6 p-6">

      <h1 className="text-4xl font-bold">
        Doctor Face Verification
      </h1>

      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full max-w-lg rounded-3xl border border-white/20"
      />

      {message && (
        <p className="text-center text-lg text-cyan-300">
          {message}
        </p>
      )}

      <button
        onClick={handleSaveFace}
        disabled={loading}
        className="bg-white text-black px-8 py-4 rounded-2xl font-bold text-lg"
      >
        {loading ? "Saving..." : "Save Face"}
      </button>

    </div>
  );
}