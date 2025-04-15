// src/App.js
import React, { useRef, useState, useEffect } from 'react';

function App() {
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunks = useRef([]);
  const streamRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const [allowedDevice, setAllowedDevice] = useState(false);

  // ✅ Detect Samsung Galaxy Note 10 Lite
  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isSamsungNote10Lite =
      userAgent.includes("samsung") &&
      userAgent.includes("sm-n770") || // SM-N770F is the Note 10 Lite
      userAgent.includes("note 10 lite");

    if (isSamsungNote10Lite) {
      setAllowedDevice(true);
    } else {
      alert("This feature is only available on Samsung Galaxy Note 10 Lite.");
    }
  }, []);

  const startRecording = async () => {
    try {
      const constraints = {
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      videoRef.current.srcObject = stream;

      // ✅ Try enabling flashlight
      const videoTrack = stream.getVideoTracks()[0];
      const capabilities = videoTrack.getCapabilities();
      if (capabilities.torch) {
        await videoTrack.applyConstraints({ advanced: [{ torch: true }] });
      }

      recordedChunks.current = [];
      const options = { mimeType: "video/webm; codecs=vp9" };
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunks.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunks.current, { type: "video/webm" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = "recorded_video.webm";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        stream.getTracks().forEach(track => track.stop());
        setIsRecording(false);
      };

      mediaRecorder.start();
      setIsRecording(true);

      setTimeout(() => {
        mediaRecorder.stop();
      }, 15000); // 15 seconds
    } catch (err) {
      console.error("Camera access failed:", err);
      alert("Could not access camera or flashlight.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4 text-white">
      <h1 className="text-xl font-semibold mb-4">Samsung Galaxy Note 10 Lite Recorder</h1>

      {allowedDevice ? (
        <>
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="rounded-lg shadow-lg w-full max-w-md"
          ></video>

          <button
            onClick={startRecording}
            disabled={isRecording}
            className={`mt-6 px-6 py-2 rounded font-semibold ${
              isRecording ? "bg-gray-500" : "bg-green-500 hover:bg-green-600"
            }`}
          >
            {isRecording ? "Recording..." : "Start 15s Video with Flashlight"}
          </button>
        </>
      ) : (
        <p className="text-red-400 text-center">
          This app only works on Samsung Galaxy Note 10 Lite.
        </p>
      )}
    </div>
  );
}

export default App;
