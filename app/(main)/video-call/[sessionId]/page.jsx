"use client";

import { useEffect, useRef } from "react";
import { useParams } from "next/navigation";

export default function VideoCallPage() {
  const jitsiContainerRef = useRef(null);
  const params = useParams();

  useEffect(() => {
    if (!params?.sessionId) return;

    // تحميل سكربت Jitsi
    const script = document.createElement("script");
    script.src = "https://meet.jit.si/external_api.js";
    script.async = true;

    script.onload = () => {
      if (!window.JitsiMeetExternalAPI) return;

      const domain = "meet.jit.si";

      const options = {
      roomName: decodeURIComponent(params.sessionId),
        parentNode: jitsiContainerRef.current,

        width: "100%",
        height: "100%",

        configOverwrite: {
          startWithAudioMuted: false,
          startWithVideoMuted: false,
        },

        interfaceConfigOverwrite: {
          SHOW_JITSI_WATERMARK: false,
          SHOW_BRAND_WATERMARK: false,
          SHOW_POWERED_BY: false,
        },
      };

      new window.JitsiMeetExternalAPI(domain, options);
    };

    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [params]);

  return (
    <div className="w-full h-screen bg-black">
      <div
        ref={jitsiContainerRef}
        className="w-full h-full"
      />
    </div>
  );
}