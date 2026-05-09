const express = require('express');
const router = express.Router();
const Gamification = require('../models/Gamification');

// Get gamification stats
router.get('/', async (req, res) => {
  try {
    let stats = await Gamification.findOne();
    if (!stats) {
      stats = await new Gamification().save();
    } else if (stats.lastCompletedAllDate) {
      // Dynamically check if streak is broken (more than 1 day passed without completing all tasks)
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const lastCompletedStart = new Date(stats.lastCompletedAllDate.getFullYear(), stats.lastCompletedAllDate.getMonth(), stats.lastCompletedAllDate.getDate());
      
      const diffDays = Math.round((todayStart - lastCompletedStart) / (1000 * 60 * 60 * 24));
      if (diffDays > 1 && stats.currentStreak > 0) {
        stats.currentStreak = 0;
        await stats.save();
      }
    }

    const xpForNextLevel = (stats.level) * 100;
    const currentLevelXP = stats.totalXP - ((stats.level - 1) * 100);
    res.json({
      ...stats.toObject(),
      xpForNextLevel,
      currentLevelXP,
      xpProgress: Math.round((currentLevelXP / 100) * 100),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reset streaks (for testing)
router.post('/reset', async (req, res) => {
  try {
    let stats = await Gamification.findOne();
    if (!stats) stats = new Gamification();
    stats.currentStreak = 0;
    stats.totalXP = 0;
    stats.level = 1;
    stats.tasksCompleted = 0;
    stats.diaryEntries = 0;
    stats.achievements = [];
    await stats.save();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reset only the streak
router.post('/reset-streak', async (req, res) => {
  try {
    let stats = await Gamification.findOne();
    if (!stats) stats = new Gamification();
    stats.currentStreak = 0;
    await stats.save();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
