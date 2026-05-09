const mongoose = require('mongoose');

const gamificationSchema = new mongoose.Schema({
  totalXP: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  currentStreak: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },
  lastActiveDate: { type: Date },
  lastCompletedAllDate: { type: Date }, // Date when all tasks were last completed for a day
  tasksCompleted: { type: Number, default: 0 },
  diaryEntries: { type: Number, default: 0 },
  achievements: [{
    name: { type: String },
    description: { type: String },
    icon: { type: String },
    unlockedAt: { type: Date, default: Date.now },
  }],
}, { timestamps: true });

// Calculate level from XP
gamificationSchema.methods.calculateLevel = function() {
  this.level = Math.floor(this.totalXP / 100) + 1;
  return this.level;
};

// Mark that all tasks for today are completed and update streak accordingly
// Called when every task for the current day has been finished
gamificationSchema.methods.markAllTasksCompleted = function() {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const lastCompleted = this.lastCompletedAllDate ? new Date(this.lastCompletedAllDate) : null;
  
  // Check if we already recorded all-tasks-completed for today
  if (lastCompleted) {
    const lastCompletedStart = new Date(lastCompleted.getFullYear(), lastCompleted.getMonth(), lastCompleted.getDate());
    if (lastCompletedStart.getTime() === todayStart.getTime()) {
      // Already counted today, don't double-increment
      return this.currentStreak;
    }
  }

  // Determine if the streak continues or resets
  if (!lastCompleted) {
    // First time completing all tasks
    this.currentStreak = 1;
  } else {
    const lastCompletedStart = new Date(lastCompleted.getFullYear(), lastCompleted.getMonth(), lastCompleted.getDate());
    const diffDays = Math.round((todayStart - lastCompletedStart) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      // Consecutive day — streak continues
      this.currentStreak += 1;
    } else if (diffDays > 1) {
      // Gap in completion — streak resets
      this.currentStreak = 1;
    }
    // diffDays === 0 is handled above (already counted today)
  }
  
  if (this.currentStreak > this.longestStreak) {
    this.longestStreak = this.currentStreak;
  }
  
  this.lastCompletedAllDate = now;
  this.lastActiveDate = now;
  return this.currentStreak;
};

// Record activity without changing streak (for partial task completions)
gamificationSchema.methods.recordActivity = function() {
  this.lastActiveDate = new Date();
};

module.exports = mongoose.model('Gamification', gamificationSchema);
