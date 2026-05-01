const mongoose = require('mongoose');

const habitSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  icon: { type: String, default: '✅' },
  color: { type: String, default: '#6C5CE7' },
  frequency: { type: String, enum: ['daily', 'weekly'], default: 'daily' },
  targetPerWeek: { type: Number, default: 7, min: 1, max: 7 },
  completedDates: [{ type: String }], // stored as YYYY-MM-DD strings
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

// Virtual: current streak
habitSchema.virtual('currentStreak').get(function () {
  if (!this.completedDates || this.completedDates.length === 0) return 0;
  const sorted = [...this.completedDates].sort().reverse();
  let streak = 0;
  const today = new Date();
  let checkDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  for (let i = 0; i < sorted.length; i++) {
    const dateStr = checkDate.toISOString().split('T')[0];
    if (sorted.includes(dateStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else if (i === 0) {
      // Allow today to not be completed yet — check yesterday
      checkDate.setDate(checkDate.getDate() - 1);
      const yesterdayStr = checkDate.toISOString().split('T')[0];
      if (sorted.includes(yesterdayStr)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    } else {
      break;
    }
  }
  return streak;
});

habitSchema.set('toJSON', { virtuals: true });
habitSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Habit', habitSchema);
