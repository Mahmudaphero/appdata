const startBtn = document.getElementById("startBtn");
const preview = document.getElementById("preview");
const recordedVideo = document.getElementById("recordedVideo");
const downloadLink = document.getElementById("downloadLink");

let mediaRecorder;
let recordedChunks = [];

async function startCamera() {
  const constraints = {
    video: {
      facingMode: { exact: "environment" },
      width: { ideal: 1920 },
      height: { ideal: 1080 }
    },
    audio: true
  };

  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    preview.srcObject = stream;

    const videoTrack = stream.getVideoTracks()[0];
    const capabilities = videoTrack.getCapabilities();
    if (capabilities.torch) {
      await videoTrack.applyConstraints({ advanced: [{ torch: true }] });
    }

    return stream;
  } catch (err) {
    alert("Camera error: " + err.message);
  }
}

startBtn.addEventListener("click", async () => {
  const stream = await startCamera();
  if (!stream) return;

  recordedChunks = [];
  mediaRecorder = new MediaRecorder(stream, { mimeType: "video/webm" });

  mediaRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) recordedChunks.push(e.data);
  };

  mediaRecorder.onstop = async () => {
    const webmBlob = new Blob(recordedChunks, { type: "video/webm" });
    const { createFFmpeg, fetchFile } = FFmpeg;
    const ffmpeg = createFFmpeg({ log: true });

    startBtn.innerText = "Converting to MP4...";
    startBtn.disabled = true;

    await ffmpeg.load();
    ffmpeg.FS('writeFile', 'input.webm', await fetchFile(webmBlob));
    await ffmpeg.run('-i', 'input.webm', '-c:v', 'libx264', '-preset', 'fast', 'output.mp4');

    const data = ffmpeg.FS('readFile', 'output.mp4');
    const mp4Blob = new Blob([data.buffer], { type: 'video/mp4' });
    const mp4URL = URL.createObjectURL(mp4Blob);

    recordedVideo.src = mp4URL;
    recordedVideo.classList.remove("hidden");

    downloadLink.href = mp4URL;
    downloadLink.classList.remove("hidden");

    startBtn.innerText = "Start Recording (15s)";
    startBtn.disabled = false;
  };

  mediaRecorder.start();
  startBtn.disabled = true;
  startBtn.innerText = "Recording...";

  setTimeout(() => {
    mediaRecorder.stop();
    stream.getTracks().forEach(track => track.stop());
  }, 15000);
});
