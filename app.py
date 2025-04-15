import cv2
import numpy as np
from scipy.signal import butter, filtfilt
from flask import Flask, request, send_file
import matplotlib.pyplot as plt
import os
from io import BytesIO

app = Flask(__name__)

# Bandpass filter: 0.7 - 4 Hz (~42-240 bpm)
def butter_bandpass(lowcut=0.7, highcut=4.0, fs=30.0, order=5):
    nyq = 0.5 * fs
    low = lowcut / nyq
    high = highcut / nyq
    b, a = butter(order, [low, high], btype='band')
    return b, a

def apply_bandpass(signal, fs=30.0):
    b, a = butter_bandpass(fs=fs)
    return filtfilt(b, a, signal)

def extract_green_signal(video_path):
    cap = cv2.VideoCapture(video_path)
    fps = cap.get(cv2.CAP_PROP_FPS)
    green_signal = []

    while True:
        ret, frame = cap.read()
        if not ret:
            break
        # Optionally crop to ROI (like forehead), here use center area
        h, w, _ = frame.shape
        roi = frame[h//4:h//2, w//3:2*w//3]  # forehead-ish region
        green = roi[:, :, 1]  # green channel
        mean_val = np.mean(green)
        green_signal.append(mean_val)

    cap.release()
    signal = np.array(green_signal)
    filtered = apply_bandpass(signal, fs=fps)
    return filtered, fps

@app.route("/upload", methods=["POST"])
def upload():
    file = request.files["video"]
    path = "temp_video.mp4"
    file.save(path)

    signal, fps = extract_green_signal(path)

    # Plot
    plt.figure(figsize=(10, 4))
    t = np.linspace(0, len(signal)/fps, len(signal))
    plt.plot(t, signal, color='green')
    plt.title("Filtered PPG Signal")
    plt.xlabel("Time (s)")
    plt.ylabel("Amplitude")
    plt.grid(True)

    # Save to buffer
    buf = BytesIO()
    plt.savefig(buf, format='png')
    buf.seek(0)
    os.remove(path)  # Clean up
    return send_file(buf, mimetype='image/png')

if __name__ == "__main__":
    app.run(debug=True)
