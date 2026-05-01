const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  dateTime: { type: Date, required: true },
  isRecurring: { type: Boolean, default: false },
  recurringPattern: { type: String, enum: ['daily', 'weekly', 'monthly', 'yearly', 'none'], default: 'none' },
  linkedTask: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
  isActive: { type: Boolean, default: true },
  lastTriggered: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Reminder', reminderSchema);
