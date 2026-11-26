import mongoose from 'mongoose';

const capturedPhotoSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },

  contentType: {
    type: String,
    required: true,
    enum: ['image/jpeg', 'image/png', 'image/webp']
  },

  image: {
    type: Buffer,
    required: true
  },

  size: {
    type: Number,
    required: true
  },

  moldNotificationSentAt: {
    type: Date,
    default: null
  },

  capturedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const CapturedPhoto = mongoose.models.CapturedPhoto ||
  mongoose.model('CapturedPhoto', capturedPhotoSchema);

export default CapturedPhoto;