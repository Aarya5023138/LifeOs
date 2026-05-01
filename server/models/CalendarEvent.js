const mongoose = require('mongoose');

const calendarEventSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  date: { type: Date, required: true },
  endDate: { type: Date },
  type: { type: String, enum: ['birthday', 'appointment', 'vaccine', 'holiday', 'meeting', 'other'], default: 'other' },
  isRecurring: { type: Boolean, default: false },
  recurringRule: { type: String, enum: ['daily', 'weekly', 'monthly', 'yearly', 'none'], default: 'none' },
  color: { type: String, default: '#6C5CE7' },
  allDay: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('CalendarEvent', calendarEventSchema);
