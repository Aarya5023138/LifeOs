const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  targetDate: { type: Date },
  status: { type: String, enum: ['not_started', 'in_progress', 'achieved', 'abandoned'], default: 'not_started' },
  category: { type: String, enum: ['personal', 'career', 'health', 'finance', 'learning', 'other'], default: 'personal' },
  progress: { type: Number, default: 0, min: 0, max: 100 }
}, { timestamps: true });

module.exports = mongoose.model('Goal', goalSchema);
