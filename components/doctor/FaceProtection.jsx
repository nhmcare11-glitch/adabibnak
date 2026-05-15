
"use client";

import { useEffect } from "react";

import { useRouter } from "next/navigation";

export default function FaceProtection() {

  const router = useRouter();

  useEffect(() => {

    const verified =
      sessionStorage.getItem(
        "doctor_face_verified"
      );

    if (!verified) {

      router.push(
        "/doctor/face-login"
      );
    }

  }, []);

  return null;
}

