
import express from 'express';
import multer from 'multer';
import mongoose from 'mongoose';

import { admin, protect } from '../middleware/auth.js';
import CapturedPhoto from '../models/CapturedPhoto.js';
import { sendMoldDetectedNotification } from '../services/moldNotification.js';

const router = express.Router();

// ========================================
// CONFIGURATION
// ========================================

const AI_SERVICE_URL = 'http://127.0.0.1:8000';
const ESP32_CAM_URL = 'http://10.58.179.102';

const MAX_FILE_SIZE = 10 * 1024 * 1024;

// ========================================
// MULTER IMAGE UPLOAD CONFIGURATION
// ========================================

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: MAX_FILE_SIZE
  },

  fileFilter: (req, file, callback) => {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      callback(null, true);
    } else {
      callback(
        new Error('Only JPG, PNG, and WEBP images are accepted.')
      );
    }
  }
});

// ========================================
// HELPER: HANDLE MULTER ERRORS
// ========================================

function handleImageUpload(req, res, next) {
  upload.single('file')(req, res, (error) => {
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    next();
  });
}

// ========================================
// HELPER: VALIDATE MONGODB ID
// ========================================

function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function getClassificationErrorStatus(error) {
  const statusCode = Number(error?.statusCode);
  return Number.isInteger(statusCode) && statusCode >= 400 && statusCode < 500
    ? statusCode
    : 500;
}

// ========================================
// HELPER: SEND IMAGE TO YOLO
// ========================================

async function classifyImage(buffer, filename, mimetype) {
  const formData = new FormData();

  const imageBlob = new Blob(
    [buffer],
    { type: mimetype }
  );

  // Python FastAPI expects the field name "file".
  formData.append('file', imageBlob, filename);

  const response = await fetch(
    `${AI_SERVICE_URL}/predict`,
    {
      method: 'POST',
      body: formData,
      signal: AbortSignal.timeout(30000)
    }
  );

  const result = await response.json();

  if (!response.ok) {
    const error = new Error(
      result.detail || 'YOLO classification failed.'
    );
    error.statusCode = response.status;
    throw error;
  }

  return result;
}

// ========================================
// HELPER: FORMAT PHOTO RESPONSE
// ========================================

function formatPhoto(photo) {
  return {
    id: photo._id,
    filename: photo.filename,
    contentType: photo.contentType,
    size: photo.size,
    capturedAt: photo.capturedAt,
    imageUrl: `/api/ai/photos/${photo._id}`
  };
}

// ========================================
// GET: AI SERVICE HEALTH
// GET /api/ai/health
// ========================================

router.get('/health', async (req, res) => {
  try {
    const response = await fetch(
      `${AI_SERVICE_URL}/health`,
      {
        signal: AbortSignal.timeout(10000)
      }
    );

    const data = await response.json();

    return res.status(response.ok ? 200 : 502).json({
      success: response.ok,
      aiService: data
    });

  } catch (error) {
    console.error('AI health error:', error);

    return res.status(503).json({
      success: false,
      message: 'Python AI service is unavailable.',
      error: error.message
    });
  }
});

// ========================================
// POST: MANUAL IMAGE CLASSIFICATION
// POST /api/ai/predict
// Form-data key: file
// ========================================

router.post(
  '/predict',
  handleImageUpload,
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Please upload an image.'
        });
      }

      const result = await classifyImage(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );

      return res.status(200).json({
        success: true,
        message: 'Image analyzed successfully.',
        data: {
          filename: result.filename,
          prediction: result.prediction,
          confidence: result.confidence,
          unit: result.unit,
          model: result.model,
          similarity: result.similarity,
          nearestSimilarity: result.nearest_similarity,
          similarityMetric: result.similarity_metric,
          similarityThreshold: result.similarity_threshold,
          matchStatus: result.match_status,
          closestClass: result.closest_class,
          predictionMethod: result.prediction_method,
          referenceImages: result.reference_images
        }
      });

    } catch (error) {
      console.error('AI prediction error:', error);

      return res.status(getClassificationErrorStatus(error)).json({
        success: false,
        message: 'Unable to process image.',
        error: error.message
      });
    }
  }
);

// ========================================
// POST: SAVE CAPTURED PHOTO TO MONGODB
// POST /api/ai/photos
// Form-data key: file
// ========================================

router.post(
  '/photos',
  handleImageUpload,
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Please upload a captured photo.'
        });
      }

      const photo = await CapturedPhoto.create({
        filename:
          req.file.originalname || `capture-${Date.now()}.jpg`,

        contentType: req.file.mimetype,

        image: req.file.buffer,

        size: req.file.size,

        capturedAt: new Date()
      });

      return res.status(201).json({
        success: true,
        message: 'Photo saved successfully to MongoDB.',
        data: formatPhoto(photo)
      });

    } catch (error) {
      console.error('MongoDB photo save error:', error);

      return res.status(500).json({
        success: false,
        message: 'Unable to save photo to MongoDB.',
        error: error.message
      });
    }
  }
);

// ========================================
// GET: RETRIEVE SAVED PHOTOS
// GET /api/ai/photos
// ========================================

router.get('/photos', async (req, res) => {
  try {
    const photos = await CapturedPhoto.find()
      .select('-image')
      .sort({ capturedAt: -1 })
      .limit(100)
      .lean();

    return res.status(200).json({
      success: true,
      count: photos.length,
      data: photos.map(formatPhoto)
    });

  } catch (error) {
    console.error('Retrieve photos error:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to retrieve saved photos.'
    });
  }
});

// ========================================
// GET: DISPLAY SAVED PHOTO
// GET /api/ai/photos/:id
// ========================================

router.get('/photos/:id', async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid photo ID.'
      });
    }

    const photo = await CapturedPhoto.findById(
      req.params.id
    );

    if (!photo) {
      return res.status(404).json({
        success: false,
        message: 'Photo not found.'
      });
    }

    res.set({
      'Content-Type': photo.contentType,
      'Content-Length': String(photo.size),
      'Cache-Control': 'private, max-age=3600',
      'X-Content-Type-Options': 'nosniff'
    });

    return res.send(photo.image);

  } catch (error) {
    console.error('Display photo error:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to display photo.'
    });
  }
});

// ========================================
// POST: RECORD TEACHABLE MACHINE SCAN FOR A SAVED PHOTO
// POST /api/ai/photos/:id/scan
// ========================================

router.post('/photos/:id/scan', protect, admin, async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid photo ID.'
      });
    }

    const photo = await CapturedPhoto.findById(
      req.params.id
    );

    if (!photo) {
      return res.status(404).json({
        success: false,
        message: 'Photo not found.'
      });
    }

    const prediction = req.body?.prediction;
    const confidence = Number(req.body?.confidence);

    if (
      typeof prediction !== 'string' ||
      !prediction.trim() ||
      prediction.length > 100 ||
      !Number.isFinite(confidence) ||
      confidence < 0 ||
      confidence > 100
    ) {
      return res.status(400).json({
        success: false,
        message: 'A valid model prediction and confidence between 0 and 100 are required.'
      });
    }

    const result = {
      prediction: prediction.trim(),
      confidence,
      unit: 'percent',
      model: 'Teachable Machine (TensorFlow.js)'
    };

    const scannedAt = new Date();
    let emailNotification = {
      sent: false,
      message: 'No mold alert is needed for this photo.'
    };

    if (String(result.prediction).trim().toLowerCase().includes('mold')) {
      if (photo.moldNotificationSentAt) {
        emailNotification = {
          sent: false,
          alreadySent: true,
          message: 'The admin was already notified about this photo.'
        };
      } else {
        try {
          await sendMoldDetectedNotification({
            filename: photo.filename,
            photoId: String(photo._id),
            confidence: result.confidence,
            scannedAt
          });
          emailNotification = {
            sent: true,
            message: 'Mold detected. Admin email notification sent.'
          };
        } catch (notificationError) {
          console.error('Mold alert email failed:', notificationError);
          emailNotification = {
            sent: false,
            error: notificationError instanceof Error
              ? notificationError.message
              : 'Unable to send the mold alert email.',
            message: 'Mold detected, but the admin email notification failed.'
          };
        }

        if (emailNotification.sent) {
          photo.moldNotificationSentAt = scannedAt;
          try {
            await photo.save();
          } catch (persistenceError) {
            console.error('Unable to save mold notification status:', persistenceError);
            emailNotification = {
              sent: true,
              error: 'Email sent, but the notification status could not be saved.',
              message: 'Mold detected. Admin email sent, but repeated scans may send another alert.'
            };
          }
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Saved photo analyzed successfully.',
      data: {
        photoId: photo._id,
        filename: photo.filename,
        prediction: result.prediction,
        confidence: result.confidence,
        unit: result.unit,
        model: result.model,
        scannedAt: scannedAt.toISOString(),
        emailNotification
      }
    });

  } catch (error) {
    console.error('Saved photo scan error:', error);

    return res.status(getClassificationErrorStatus(error)).json({
      success: false,
      message: 'Unable to scan saved photo.',
      error: error.message
    });
  }
});

// ========================================
// DELETE: REMOVE SAVED PHOTO
// DELETE /api/ai/photos/:id
// ========================================

router.delete('/photos/:id', async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid photo ID.'
      });
    }

    const photo = await CapturedPhoto.findByIdAndDelete(
      req.params.id
    );

    if (!photo) {
      return res.status(404).json({
        success: false,
        message: 'Photo not found.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Photo deleted successfully.'
    });

  } catch (error) {
    console.error('Delete photo error:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to delete photo.'
    });
  }
});

// ========================================
// GET: LIVE ESP32-CAM CLASSIFICATION
// GET /api/ai/live
// ========================================

router.get('/live', async (req, res) => {
  try {
    // 1. Capture image from ESP32-CAM.

    const cameraResponse = await fetch(
      `${ESP32_CAM_URL}/capture`,
      {
        signal: AbortSignal.timeout(15000)
      }
    );

    if (!cameraResponse.ok) {
      throw new Error(
        `Camera capture failed: HTTP ${cameraResponse.status}`
      );
    }

    const contentType =
      cameraResponse.headers.get('content-type') || '';

    if (!contentType.toLowerCase().includes('image/jpeg')) {
      throw new Error(
        `Camera did not return a JPEG image. Received: ${contentType}`
      );
    }

    const imageBuffer = Buffer.from(
      await cameraResponse.arrayBuffer()
    );

    if (!imageBuffer.length) {
      throw new Error('ESP32-CAM returned an empty image.');
    }

    if (imageBuffer.length > MAX_FILE_SIZE) {
      throw new Error('Camera image exceeds the 10 MB limit.');
    }

    // 2. Send image to YOLO.

    const result = await classifyImage(
      imageBuffer,
      'esp32-live.jpg',
      'image/jpeg'
    );

    // 3. Return classification.

    return res.status(200).json({
      success: true,
      message: 'Live camera image classified successfully.',
      source: 'ESP32-CAM',
      cameraIP: '10.58.179.102',
      capturedAt: new Date().toISOString(),

      image: {
        filename: 'esp32-live.jpg',
        size: imageBuffer.length
      },

      prediction: result.prediction,
      confidence: result.confidence,
      unit: result.unit,
      model: result.model,
      similarity: result.similarity,
      nearestSimilarity: result.nearest_similarity,
      similarityMetric: result.similarity_metric,
      similarityThreshold: result.similarity_threshold,
      matchStatus: result.match_status,
      closestClass: result.closest_class,
      predictionMethod: result.prediction_method,
      referenceImages: result.reference_images
    });

  } catch (error) {
    console.error('Live AI classification error:', error);

    return res.status(getClassificationErrorStatus(error)).json({
      success: false,
      message: 'Live camera classification failed.',
      error: error.message
    });
  }
});

// ========================================
// EXPORT ROUTER
// ========================================

export default router;
