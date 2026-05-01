const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const Reminder = require('../models/Reminder');
const CalendarEvent = require('../models/CalendarEvent');
const DiaryEntry = require('../models/DiaryEntry');
const Gamification = require('../models/Gamification');

// Dashboard summary
router.get('/', async (req, res) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);
    const weekEnd = new Date(todayStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const [
      totalTasks,
      completedTasks,
      pendingTasks,
      overdueTasks,
      todayTasks,
      upcomingReminders,
      upcomingEvents,
      recentDiary,
      gamification,
      moodStats,
    ] = await Promise.all([
      Task.countDocuments(),
      Task.countDocuments({ status: 'done' }),
      Task.countDocuments({ status: { $ne: 'done' } }),
      Task.countDocuments({ status: { $ne: 'done' }, dueDate: { $lt: now } }),
      Task.find({ dueDate: { $gte: todayStart, $lt: todayEnd } }).limit(10),
      Reminder.find({ dateTime: { $gte: now }, isActive: true }).sort({ dateTime: 1 }).limit(5),
      CalendarEvent.find({ date: { $gte: todayStart, $lte: weekEnd } }).sort({ date: 1 }).limit(10),
      DiaryEntry.find().sort({ date: -1 }).limit(5),
      Gamification.findOne(),
      DiaryEntry.aggregate([
        { $match: { date: { $gte: new Date(now.getFullYear(), now.getMonth(), 1) } } },
        { $group: { _id: '$mood', count: { $sum: 1 } } },
      ]),
    ]);

    res.json({
      tasks: { total: totalTasks, completed: completedTasks, pending: pendingTasks, overdue: overdueTasks, today: todayTasks },
      reminders: upcomingReminders,
      events: upcomingEvents,
      recentDiary,
      gamification: gamification || { totalXP: 0, level: 1, currentStreak: 0 },
      moodStats,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
