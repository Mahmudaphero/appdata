const startBtn = document.getElementById('startBtn');
const preview = document.getElementById('preview');

let mediaStream;
let mediaRecorder;
let recordedChunks = [];

async function startRecording() {
  // Get the highest resolution possible
  const constraints = {
    video: {
      facingMode: { ideal: 'environment' },
      width: { ideal: 1920 },
      height: { ideal: 1080 }
    },
    audio: false
  };

  try {
    mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
    preview.srcObject = mediaStream;

    // Turn on flashlight (if supported)
    const track = mediaStream.getVideoTracks()[0];
    const capabilities = track.getCapabilities();
    if (capabilities.torch) {
      const imageCapture = new ImageCapture(track);
      const photoSettings = { torch: true };
      await track.applyConstraints({ advanced: [photoSettings] });
    }

    // Start recording
    recordedChunks = [];
    mediaRecorder = new MediaRecorder(mediaStream, {
      mimeType: 'video/webm;codecs=vp9'
    });

    mediaRecorder.ondataavailable = e => {
      if (e.data.size > 0) recordedChunks.push(e.data);
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'recorded_video.webm';
      a.click();
      URL.revokeObjectURL(url);

      // Stop all tracks
      mediaStream.getTracks().forEach(track => track.stop());
    };

    mediaRecorder.start();
    startBtn.disabled = true;
    startBtn.innerText = 'Recording...';

    // Stop after 15 seconds
    setTimeout(() => {
      mediaRecorder.stop();
      startBtn.innerText = 'Recording Finished';
    }, 15000);
  } catch (err) {
    console.error('Error:', err);
    alert('Error accessing camera or flashlight.');
  }
}

startBtn.addEventListener('click', startRecording);
