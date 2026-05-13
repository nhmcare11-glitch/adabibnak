"use client";

import { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";

export default function VerificationPage() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [captured, setCaptured] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);

  useEffect(() => {
    loadModels();
    startCamera();

    return () => {
      stopCamera();
    };
  }, []);

  const loadModels = async () => {
    const MODEL_URL = "/models";

    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ]);

    console.log("FaceAPI Models Loaded");
    setModelsLoaded(true);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        videoRef.current.onloadedmetadata = async () => {
          await videoRef.current.play();
        };
      }
    } catch (error) {
      console.error(error);
      alert("Camera Error");
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();

      tracks.forEach((track) => track.stop());
    }
  };

  const captureFace = async () => {
    if (!modelsLoaded) {
      alert("Models are still loading...");
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) return;

    setLoading(true);

    try {
      const detection = await faceapi
        .detectSingleFace(
          video,
          new faceapi.TinyFaceDetectorOptions()
        )
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        alert("No face detected");
        setLoading(false);
        return;
      }

      const context = canvas.getContext("2d");

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = canvas.toDataURL("image/png");

      setCaptured(imageData);

      const descriptor = Array.from(detection.descriptor);

      const doctorId ="5aebd33f-9eab-4a53-9bec-5bba508091f8"

      const response = await fetch(
        "/api/doctor/face-verification",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            doctorId,
            image: imageData,
            descriptor,
          }),
        }
      );

      const data = await response.json();

      console.log(data);

      alert("Face Registered Successfully");

      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#edf4f3] flex items-center justify-center p-6">
      <div className="bg-white rounded-[32px] shadow-2xl p-8 w-full max-w-md">
        <h1 className="text-6xl font-black text-center text-[#0b132b] leading-none">
          Face
          <br />
          Verification
        </h1>

        <p className="text-center text-[#8f9bb3] mt-6 mb-8 text-lg">
          قم بتوثيق هويتك عبر التعرف على الوجه
        </p>

        <div className="bg-[#e7efee] rounded-[30px] p-4">
          {!captured ? (
            <>
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-[350px] object-cover rounded-[24px] bg-black"
              />

              <button
                onClick={captureFace}
                disabled={loading}
                className="w-full mt-4 bg-[#17b8ab] hover:bg-[#10998f] text-white font-bold py-4 rounded-2xl transition"
              >
                {loading ? "Scanning..." : "Scan My Face"}
              </button>
            </>
          ) : (
            <>
              <img
                src={captured}
                alt="captured"
                className="w-full h-[350px] object-cover rounded-[24px]"
              />

              <p className="text-center text-green-600 font-semibold mt-4">
                تم حفظ البصمة الوجهية بنجاح
              </p>
            </>
          )}
        </div>

        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
}