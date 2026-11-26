<template>
  <div class="camera-page">
    <div class="camera-container">
      <header class="page-header">
        <div>
          <h1>Water Lily Camera Monitor</h1>
          <p>Capture, save, and inspect your water lily products.</p>
        </div>

        <div
          class="connection-status"
          :class="cameraConnected ? 'connected' : 'disconnected'"
        >
          <span class="status-dot"></span>
          {{ cameraConnected ? 'Camera Connected' : 'Camera Disconnected' }}
        </div>
      </header>

      <!-- LIVE CAMERA -->
      <section class="camera-card">
        <div class="card-header">
          <div>
            <h2>Live Camera Feed</h2>
            <p>ESP32-CAM real-time video monitoring</p>
          </div>

          <span v-if="cameraConnected" class="live-badge">
            <span></span> LIVE
          </span>
        </div>

        <div class="camera-display">
          <img
            v-if="cameraStreaming && cameraStreamUrl"
            ref="liveImage"
            :src="cameraStreamUrl"
            crossorigin="anonymous"
            alt="ESP32-CAM Live Stream"
            class="camera-image"
            @load="handleStreamLoad"
            @error="handleStreamError"
          />

          <div v-else class="camera-placeholder">
            <div class="camera-icon">📷</div>
            <h3>
              {{ cameraStreaming ? 'Connecting to camera...' : 'Camera is stopped' }}
            </h3>
            <p>
              {{
                cameraStreaming
                  ? 'Waiting for ESP32-CAM video feed.'
                  : 'Click Start Camera to view the live feed.'
              }}
            </p>
          </div>

          <div
            v-if="cameraStreaming && !cameraConnected"
            class="connecting-overlay"
          >
            <div class="loader"></div>
            <p>Connecting to ESP32-CAM...</p>
          </div>
        </div>

        <div class="camera-footer">
          <span>{{ cameraMessage }}</span>
          <span>ESP32-CAM: {{ CAMERA_IP }}</span>
        </div>

        <!-- CAMERA CONTROLS -->
        <div class="control-buttons">
          <button
            class="btn btn-success"
            @click="startCamera"
            :disabled="cameraStreaming"
          >
            ▶ Start Camera
          </button>

          <button
            class="btn btn-danger"
            @click="stopCamera"
            :disabled="!cameraStreaming"
          >
            ■ Stop Camera
          </button>

          <button
            class="btn btn-primary"
            @click="capturePhoto"
            :disabled="capturing || !cameraStreaming || !cameraConnected"
          >
            {{ capturing ? 'Capturing...' : '📸 Capture Photo' }}
          </button>

          <button
            class="btn"
            :class="flashOn ? 'btn-warning' : 'btn-secondary'"
            @click="toggleFlash"
            :disabled="flashLoading"
          >
            ⚡ {{ flashOn ? 'Flashlight ON' : 'Flashlight OFF' }}
          </button>
        </div>

        <div class="camera-note">
          ℹ️ Photo capture uses the current live-stream frame to avoid requesting a second camera capture.
        </div>
      </section>

      <!-- NOTIFICATION -->
      <div
        v-if="notification.message"
        class="notification"
        :class="notification.type"
      >
        {{ notification.message }}
        <button @click="notification.message = ''">×</button>
      </div>

      <!-- CAPTURED PHOTO -->
      <section
        v-if="capturedPhoto"
        ref="photoSection"
        class="photo-card"
      >
        <div class="card-header">
          <div>
            <h2>Captured Photo</h2>
            <p>Your captured image and MongoDB record</p>
          </div>

          <span
            class="saved-badge"
            :class="{ 'not-saved': !capturedPhoto.id }"
          >
            {{ capturedPhoto.id ? '✓ Saved to MongoDB' : 'Not saved' }}
          </span>
        </div>

        <img
          :src="capturedPhoto.previewUrl"
          alt="Captured ESP32-CAM photo"
          class="captured-image"
        />

        <div class="photo-information">
          <div>
            <span>Filename</span>
            <strong>{{ capturedPhoto.filename }}</strong>
          </div>

          <div>
            <span>File size</span>
            <strong>{{ formatFileSize(capturedPhoto.size) }}</strong>
          </div>

          <div>
            <span>Captured</span>
            <strong>{{ capturedPhoto.capturedAt }}</strong>
          </div>

          <div>
            <span>MongoDB ID</span>
            <strong class="photo-id">
              {{ capturedPhoto.id || 'Upload unsuccessful' }}
            </strong>
          </div>
        </div>

        <!-- PHOTO ACTIONS -->
        <div class="photo-actions">
          <button
            class="btn btn-success"
            @click="scanPhoto"
            :disabled="!capturedPhoto.id || scanning"
          >
            {{ scanning ? 'Analyzing Photo...' : '🔍 Scan Photo' }}
          </button>

          <button
            class="btn btn-primary"
            @click="downloadPhoto"
          >
            ⬇ Download Photo
          </button>
        </div>

        <!-- AI RESULT -->
        <div
          v-if="aiResult"
          ref="resultSection"
          class="result-card"
        >
          <div class="card-header">
            <div>
              <h2>Product Inspection Result</h2>
              <p>Teachable Machine image classification</p>
            </div>
            <span class="ai-badge">AI POWERED</span>
          </div>

          <div
            class="result-status"
            :class="{
              'result-moldy': isMoldyPrediction,
              'result-healthy': !isMoldyPrediction
            }"
          >
            <div class="result-icon">
              {{
                isMoldyPrediction
                  ? '⚠️'
                  : '✓'
              }}
            </div>

            <div>
              <span class="result-label">CLASSIFICATION</span>
              <h3>{{ aiResult.prediction.toUpperCase() }}</h3>
              <p v-if="isMoldyPrediction">
                Potential mold classification. Please inspect this product.
              </p>
              <p v-else>
                The model classified this product as healthy.
              </p>
            </div>
          </div>

          <div
            v-if="isMoldyPrediction"
            class="mold-recommendation"
            role="status"
          >
            <h4>Recommended action</h4>
            <p>
              Move the item to a clean, dry, well-ventilated area and sun-dry it briefly.
              Avoid prolonged direct sunlight, and make sure it is completely dry before storage.
            </p>
            <p v-if="aiResult.emailNotification?.sent">
              Admin email notification sent.
            </p>
            <p v-else-if="aiResult.emailNotification?.alreadySent">
              The admin was already notified about this photo.
            </p>
            <p v-else>
              Admin email notification failed:
              {{ aiResult.emailNotification?.error || 'No email service response.' }}
            </p>
          </div>

          <div class="confidence-section">
            <div class="confidence-heading">
              <span>Model confidence</span>
              <strong>{{ formatConfidence(aiResult.confidence) }}</strong>
            </div>

            <div class="confidence-track">
              <div
                class="confidence-fill"
                :class="{
                  'moldy-fill': isMoldyPrediction,
                  'healthy-fill': !isMoldyPrediction
                }"
                :style="{ width: `${confidencePercentage}%` }"
              ></div>
            </div>
          </div>

          <div class="result-details">
            <div>
              <span>Scanned at</span>
              <strong>{{ aiResult.scannedAt }}</strong>
            </div>

            <div>
              <span>AI model</span>
              <strong>{{ aiResult.model }}</strong>
            </div>

            <div>
              <span>Image source</span>
              <strong>Captured photo</strong>
            </div>
          </div>

          <p class="result-disclaimer">
            AI predictions are estimates. Please verify the actual product
            condition before making a final decision.
          </p>
        </div>

        <div v-if="scanError" class="scan-error">
          {{ scanError }}
        </div>
      </section>

      <!-- EMPTY PHOTO -->
      <section v-else class="empty-photo">
        <div>🖼️</div>
        <h3>No Captured Photo Yet</h3>
        <p>
          Start the camera and capture a photo. Your image will
          automatically be uploaded to MongoDB.
        </p>
      </section>

      <footer class="page-footer">
        <span>Water Lily Handicrafts</span>
        <span>ESP32-CAM · MongoDB · TensorFlow.js</span>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  ref,
  computed,
  nextTick,
  onUnmounted
} from 'vue';
import type * as tmImage from '@teachablemachine/image';
import { useAuth } from '../../composables/useAuth.js';

// =====================================
// CONFIGURATION
// =====================================

const CAMERA_IP = '10.228.89.102';

const STREAM_URL = `http://${CAMERA_IP}:81/stream`;

const FLASH_ON_URL = `http://${CAMERA_IP}/light_on`;
const FLASH_OFF_URL = `http://${CAMERA_IP}/light_off`;

const API_BASE_URL = 'http://localhost:5000';

const PHOTO_UPLOAD_URL = `${API_BASE_URL}/api/ai/photos`;
const MODEL_URL =
  'https://teachablemachine.withgoogle.com/models/PUY-KziGD/';
const { authFetch } = useAuth();
let teachableModel: Awaited<ReturnType<typeof tmImage.load>> | null = null;

// =====================================
// TYPES
// =====================================

interface CapturedPhoto {
  id: string;
  filename: string;
  size: number;
  capturedAt: string;
  previewUrl: string;
}

interface AIResult {
  prediction: string;
  confidence: number;
  model: string;
  scannedAt: string;
  emailNotification?: {
    sent: boolean;
    alreadySent?: boolean;
    error?: string;
    message?: string;
  };
}

// =====================================
// CAMERA STATE
// =====================================

const cameraStreaming = ref(false);
const cameraConnected = ref(false);

const cameraStreamUrl = ref('');
const cameraMessage = ref('Camera is not started.');

const liveImage = ref<HTMLImageElement | null>(null);

const capturing = ref(false);

const flashOn = ref(false);
const flashLoading = ref(false);

// =====================================
// PHOTO STATE
// =====================================

const capturedPhoto = ref<CapturedPhoto | null>(null);

const photoSection = ref<HTMLElement | null>(null);

// =====================================
// AI STATE
// =====================================

const scanning = ref(false);
const aiResult = ref<AIResult | null>(null);
const isMoldyPrediction = computed(
  () => aiResult.value?.prediction.trim().toLowerCase().includes('mold') ?? false
);
const scanError = ref('');

const resultSection = ref<HTMLElement | null>(null);

// =====================================
// NOTIFICATIONS
// =====================================

const notification = ref({
  message: '',
  type: 'success'
});

let notificationTimeout: ReturnType<typeof setTimeout> | null = null;

function showMessage(
  message: string,
  type: 'success' | 'error' | 'info' = 'success'
) {
  notification.value = { message, type };

  if (notificationTimeout) {
    clearTimeout(notificationTimeout);
  }

  notificationTimeout = setTimeout(() => {
    notification.value.message = '';
  }, 5000);
}

// =====================================
// OBJECT URL MANAGEMENT
// =====================================

const objectUrls = new Set<string>();

function createPreviewUrl(blob: Blob) {
  const url = URL.createObjectURL(blob);
  objectUrls.add(url);
  return url;
}

function revokePreviewUrl(url: string) {
  if (objectUrls.has(url)) {
    URL.revokeObjectURL(url);
    objectUrls.delete(url);
  }
}

// =====================================
// CAMERA CONTROLS
// =====================================

function startCamera() {
  if (cameraStreaming.value) return;

  cameraStreaming.value = true;
  cameraConnected.value = false;
  cameraMessage.value = 'Connecting to ESP32-CAM...';

  cameraStreamUrl.value = `${STREAM_URL}?t=${Date.now()}`;

  showMessage('Connecting to ESP32-CAM...', 'info');
}

function handleStreamLoad() {
  cameraConnected.value = true;
  cameraMessage.value = 'Live camera feed is running.';
}

function handleStreamError() {
  cameraConnected.value = false;
  cameraMessage.value = 'Camera stream interrupted. Check ESP32-CAM connection.';
}

function stopCamera() {
  cameraStreaming.value = false;
  cameraConnected.value = false;
  cameraStreamUrl.value = '';

  cameraMessage.value = 'Camera is stopped.';

  showMessage('Camera stopped.', 'info');
}

// =====================================
// CAPTURE PHOTO FROM LIVE STREAM
// =====================================

async function capturePhoto() {
  if (capturing.value || !cameraStreaming.value) return;

  capturing.value = true;

  try {
    await nextTick();

    const image = liveImage.value;

    if (!image || !image.complete || !image.naturalWidth) {
      throw new Error(
        'The live camera feed is not ready. Please wait for the video to load.'
      );
    }

    const canvas = document.createElement('canvas');

    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;

    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('Unable to create the photo capture canvas.');
    }

    context.drawImage(
      image,
      0,
      0,
      canvas.width,
      canvas.height
    );

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        result => {
          if (result) {
            resolve(result);
          } else {
            reject(new Error('Unable to generate the captured photo.'));
          }
        },
        'image/jpeg',
        0.92
      );
    });

    if (!blob.size) {
      throw new Error('The captured photo is empty.');
    }

    if (blob.size > 10 * 1024 * 1024) {
      throw new Error('Image exceeds the 10 MB upload limit.');
    }

    const filename = `water-lily-${Date.now()}.jpg`;
    const previewUrl = createPreviewUrl(blob);

    if (capturedPhoto.value) {
      revokePreviewUrl(capturedPhoto.value.previewUrl);
    }

    capturedPhoto.value = {
      id: '',
      filename,
      size: blob.size,
      capturedAt: new Date().toLocaleString(),
      previewUrl
    };

    aiResult.value = null;
    scanError.value = '';

    showMessage('Photo captured. Uploading to MongoDB...', 'info');

    await uploadPhotoToMongoDB(blob, filename);

    await nextTick();

    photoSection.value?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });

    await scanPhoto();

  } catch (error) {
    console.error('Capture error:', error);

    const message = error instanceof Error
      ? error.message
      : 'Photo capture failed.';

    if (
      error instanceof DOMException &&
      error.name === 'SecurityError'
    ) {
      showMessage(
        'Canvas capture was blocked by CORS. Enable CORS headers on the ESP32-CAM stream.',
        'error'
      );
    } else {
      showMessage(message, 'error');
    }

  } finally {
    capturing.value = false;
  }
}

// =====================================
// UPLOAD PHOTO TO MONGODB
// =====================================

async function uploadPhotoToMongoDB(
  blob: Blob,
  filename: string
) {
  const formData = new FormData();

  formData.append('file', blob, filename);

  const response = await fetch(PHOTO_UPLOAD_URL, {
    method: 'POST',
    body: formData,
    signal: AbortSignal.timeout(30000)
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(
      result.message || 'Failed to save photo to MongoDB.'
    );
  }

  if (!capturedPhoto.value) return;

  capturedPhoto.value.id = result.data.id;
  capturedPhoto.value.filename =
    result.data.filename || filename;

  capturedPhoto.value.size =
    result.data.size ?? blob.size;

  capturedPhoto.value.capturedAt = result.data.capturedAt
    ? new Date(result.data.capturedAt).toLocaleString()
    : new Date().toLocaleString();

  showMessage('Photo successfully saved to MongoDB.', 'success');
}

// =====================================
// SCAN SAVED PHOTO
// =====================================

async function scanPhoto() {
  if (!capturedPhoto.value?.id || scanning.value) return;

  scanning.value = true;
  scanError.value = '';
  aiResult.value = null;

  try {
    const photoId = capturedPhoto.value.id;
    if (MODEL_URL.includes('REPLACE_WITH_YOUR_MODEL_ID')) {
      throw new Error(
        'Set MODEL_URL to your Teachable Machine model URL before scanning.'
      );
    }

    if (!teachableModel) {
      const modelBaseUrl = MODEL_URL.endsWith('/')
        ? MODEL_URL
        : `${MODEL_URL}/`;
      const tmImage = await import('@teachablemachine/image');
      teachableModel = await tmImage.load(
        `${modelBaseUrl}model.json`,
        `${modelBaseUrl}metadata.json`
      );
    }

    const image = new Image();
    image.src = capturedPhoto.value.previewUrl;
    await image.decode();

    const predictions = await teachableModel.predict(image);
    if (!predictions.length) {
      throw new Error('The Teachable Machine model returned no predictions.');
    }

    const bestPrediction = predictions.reduce((best, prediction) =>
      prediction.probability > best.probability ? prediction : best
    );
    const confidence = bestPrediction.probability * 100;

    const result = await authFetch(
      `/ai/photos/${encodeURIComponent(photoId)}/scan`,
      {
        method: 'POST',
        body: JSON.stringify({
          prediction: bestPrediction.className,
          confidence
        }),
        signal: AbortSignal.timeout(45000)
      }
    );

    if (!result.success) {
      throw new Error(
        result.message || 'AI classification failed.'
      );
    }

    const data = result.data;

    aiResult.value = {
      prediction: data.prediction,
      confidence: Number(data.confidence),
      model: data.model || 'Teachable Machine (TensorFlow.js)',
      scannedAt: data.scannedAt
        ? new Date(data.scannedAt).toLocaleString()
        : new Date().toLocaleString(),
      emailNotification: data.emailNotification
    };

    if (isMoldyPrediction.value) {
      showMessage(
        data.emailNotification?.message ||
          'Mold detected. Review the recommended care action.',
        data.emailNotification?.sent || data.emailNotification?.alreadySent
          ? 'success'
          : 'error'
      );
    } else {
      showMessage('Photo analyzed successfully.', 'success');
    }

    await nextTick();

    requestAnimationFrame(() => {
      resultSection.value?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    });

  } catch (error) {
    console.error('Photo scan error:', error);

    scanError.value = error instanceof Error
      ? error.message
      : 'Unable to scan photo.';

    showMessage(scanError.value, 'error');

  } finally {
    scanning.value = false;
  }
}

// =====================================
// DOWNLOAD PHOTO
// =====================================

function downloadPhoto() {
  if (!capturedPhoto.value) return;

  const link = document.createElement('a');

  link.href = capturedPhoto.value.previewUrl;
  link.download = capturedPhoto.value.filename;

  document.body.appendChild(link);
  link.click();
  link.remove();

  showMessage('Photo download started.', 'success');
}

// =====================================
// FLASHLIGHT
// =====================================

async function toggleFlash() {
  if (flashLoading.value) return;

  flashLoading.value = true;

  const nextState = !flashOn.value;
  const url = nextState ? FLASH_ON_URL : FLASH_OFF_URL;

  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      throw new Error('Flashlight request failed.');
    }

    flashOn.value = nextState;

    showMessage(
      nextState ? 'Flashlight turned ON.' : 'Flashlight turned OFF.',
      'success'
    );

  } catch (error) {
    console.error('Flashlight error:', error);

    showMessage(
      error instanceof Error
        ? error.message
        : 'Unable to control flashlight.',
      'error'
    );

  } finally {
    flashLoading.value = false;
  }
}

// =====================================
// DISPLAY HELPERS
// =====================================

function formatFileSize(bytes: number) {
  if (!Number.isFinite(bytes) || bytes < 0) return 'N/A';

  return `${(bytes / 1024).toFixed(2)} KB`;
}

function formatConfidence(value: number) {
  if (!Number.isFinite(value)) return 'N/A';

  const percentage = value <= 1 ? value * 100 : value;

  return `${percentage.toFixed(2)}%`;
}

const confidencePercentage = computed(() => {
  if (!aiResult.value) return 0;

  const value = aiResult.value.confidence;
  const percentage = value <= 1 ? value * 100 : value;

  return Math.max(0, Math.min(100, percentage));
});

// =====================================
// CLEANUP
// =====================================

onUnmounted(() => {
  if (notificationTimeout) {
    clearTimeout(notificationTimeout);
  }

  cameraStreaming.value = false;
  cameraConnected.value = false;
  cameraStreamUrl.value = '';

  objectUrls.forEach(url => URL.revokeObjectURL(url));
  objectUrls.clear();
});
</script>

<style scoped>
.camera-page {
  min-height: 100vh;
  padding: 28px;
  background: #f4f6fa;
  box-sizing: border-box;
}

.camera-container {
  max-width: 1400px;
  margin: auto;
}

.page-header,
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h1 {
  margin: 0;
  color: #172033;
  font-size: 27px;
  font-weight: 800;
}

.page-header p,
.card-header p {
  color: #8791a3;
  font-size: 13px;
}

.connection-status {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 10px 15px;
  border-radius: 30px;
  font-size: 12px;
  font-weight: 700;
}

.connected {
  color: #16834b;
  background: #e5f8ed;
}

.disconnected {
  color: #c33d3d;
  background: #fdeaea;
}

.status-dot,
.live-badge span {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: currentColor;
}

.camera-card,
.photo-card,
.empty-photo {
  margin-bottom: 22px;
  padding: 22px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 5px 20px #1423410f;
}

.card-header {
  margin-bottom: 18px;
}

.card-header h2 {
  margin: 0;
  color: #202a3c;
  font-size: 19px;
}

.card-header p {
  margin: 6px 0 0;
}

.live-badge {
  display: flex;
  align-items: center;
  gap: 7px;
  color: #e33e3e;
  font-size: 12px;
  font-weight: 800;
}

.camera-display {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  min-height: 250px;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  background: #101722;
  border-radius: 12px;
}

.camera-image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.camera-placeholder {
  padding: 20px;
  color: white;
  text-align: center;
}

.camera-icon {
  font-size: 55px;
}

.camera-placeholder p {
  color: #aab4c3;
  font-size: 13px;
}

.connecting-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 12px;
  color: white;
  background: #101722aa;
  pointer-events: none;
}

.loader {
  width: 32px;
  height: 32px;
  border: 4px solid #ffffff55;
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.camera-footer {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-top: 13px;
  color: #7e899c;
  font-size: 12px;
}

.control-buttons,
.photo-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 20px;
}

.btn {
  border: none;
  border-radius: 9px;
  padding: 13px 18px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: 0.2s;
}

.btn:hover:not(:disabled) {
  transform: translateY(-2px);
  filter: brightness(0.95);
}

.btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.btn-success {
  color: white;
  background: #16a05a;
}

.btn-danger {
  color: white;
  background: #dc4141;
}

.btn-primary {
  color: white;
  background: #2864d7;
}

.btn-warning {
  color: #202020;
  background: #f0a51a;
}

.btn-secondary {
  color: white;
  background: #687386;
}

.camera-note {
  margin-top: 16px;
  color: #778197;
  font-size: 12px;
  line-height: 1.5;
}

.notification {
  position: fixed;
  right: 25px;
  bottom: 25px;
  z-index: 1000;
  display: flex;
  justify-content: space-between;
  gap: 15px;
  max-width: 450px;
  padding: 14px 18px;
  border-radius: 10px;
  color: white;
  box-shadow: 0 5px 20px #0002;
  font-size: 13px;
}

.notification button {
  border: 0;
  color: white;
  background: transparent;
  font-size: 20px;
  cursor: pointer;
}

.notification.success {
  background: #16834b;
}

.notification.error {
  background: #c33d3d;
}

.notification.info {
  background: #2864d7;
}

.photo-card {
  scroll-margin-top: 20px;
}

.saved-badge {
  padding: 8px 12px;
  border-radius: 20px;
  color: #16834b;
  background: #e5f8ed;
  font-size: 11px;
  font-weight: 800;
}

.saved-badge.not-saved {
  color: #a56b12;
  background: #fff2df;
}

.captured-image {
  display: block;
  width: 100%;
  max-height: 550px;
  object-fit: contain;
  border-radius: 12px;
  background: #101722;
}

.photo-information,
.result-details {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-top: 18px;
}

.photo-information div,
.result-details div {
  display: flex;
  flex-direction: column;
  gap: 7px;
  min-width: 0;
  padding: 13px;
  border: 1px solid #edf0ed;
  border-radius: 9px;
  background: #f8faf9;
}

.photo-information span,
.result-details span {
  color: #8791a3;
  font-size: 11px;
}

.photo-information strong,
.result-details strong {
  overflow-wrap: anywhere;
  color: #283247;
  font-size: 12px;
}

.photo-id {
  font-family: monospace;
}

.result-card {
  margin-top: 24px;
  padding: 20px;
  border: 1px solid #e6ece6;
  border-radius: 13px;
  background: #fbfdfb;

  /* NEW: Keep the result visible below the top edge when scrolling. */
  scroll-margin-top: 25px;
}

.ai-badge {
  padding: 7px 11px;
  border-radius: 20px;
  color: #2864d7;
  background: #eaf0ff;
  font-size: 10px;
  font-weight: 800;
}

.result-status {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  border-radius: 12px;
}

.result-healthy {
  color: #16834b;
  background: #e5f8ed;
}

.result-moldy {
  color: #bd4326;
  background: #fff0e6;
}

.result-uncertain {
  color: #806000;
  background: #fff8db;
}

.result-icon {
  font-size: 35px;
}

.result-label {
  font-size: 10px;
  font-weight: 800;
}

.result-status h3 {
  margin: 5px 0;
  font-size: 23px;
}

.result-status p {
  margin: 0;
  font-size: 12px;
}

.mold-recommendation {
  margin-top: 16px;
  padding: 16px;
  border: 1px solid #f3c7a8;
  border-radius: 10px;
  color: #71351f;
  background: #fff7ed;
}

.mold-recommendation h4 {
  margin: 0 0 8px;
  font-size: 14px;
}

.mold-recommendation p {
  margin: 0;
  font-size: 13px;
  line-height: 1.6;
}

.mold-recommendation p + p {
  margin-top: 10px;
  font-weight: 600;
}

.confidence-section {
  margin-top: 20px;
}

.confidence-heading {
  display: flex;
  justify-content: space-between;
  margin-bottom: 9px;
  color: #677286;
  font-size: 13px;
}

.confidence-track {
  height: 10px;
  overflow: hidden;
  border-radius: 20px;
  background: #e9edf3;
}

.confidence-fill {
  height: 100%;
  border-radius: 20px;
  transition: width 0.4s ease;
}

.healthy-fill {
  background: #16a05a;
}

.moldy-fill {
  background: #dc4141;
}

.uncertain-fill {
  background: #d9a514;
}

.result-disclaimer {
  margin-top: 18px;
  color: #89938c;
  font-size: 11px;
  line-height: 1.6;
}

.scan-error {
  margin-top: 15px;
  padding: 12px;
  border-radius: 9px;
  color: #b42323;
  background: #fdeaea;
  font-size: 12px;
  overflow-wrap: anywhere;
}

.empty-photo {
  padding: 40px 20px;
  text-align: center;
}

.empty-photo > div {
  font-size: 45px;
}

.empty-photo h3 {
  color: #283247;
}

.empty-photo p {
  color: #8791a3;
  font-size: 13px;
}

.page-footer {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-top: 28px;
  padding: 18px 0;
  border-top: 1px solid #e2e9e2;
  color: #8a958d;
  font-size: 11px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 700px) {
  .camera-page {
    padding: 15px;
  }

  .page-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .page-header h1 {
    font-size: 22px;
  }

  .camera-card,
  .photo-card {
    padding: 15px;
  }

  .camera-display {
    min-height: 200px;
  }

  .control-buttons,
  .photo-actions {
    flex-direction: column;
  }

  .btn {
    width: 100%;
  }

  .photo-information,
  .result-details {
    grid-template-columns: 1fr;
  }

  .camera-footer,
  .page-footer {
    flex-direction: column;
  }

  .card-header {
    align-items: flex-start;
  }
}
</style>