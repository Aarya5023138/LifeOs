const mongoose = require('mongoose');

const diaryEntrySchema = new mongoose.Schema({
  date: { type: Date, required: true },
  content: { type: String, required: true },
  mood: { type: String, enum: ['amazing', 'happy', 'neutral', 'sad', 'terrible'], default: 'neutral' },
  moodScore: { type: Number, min: 1, max: 5, default: 3 },
  tags: [{ type: String }],
  attachments: [{ type: String }], // File path or URL
  isPrivate: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('DiaryEntry', diaryEntrySchema);
