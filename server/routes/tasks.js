const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const Gamification = require('../models/Gamification');

// Get all tasks with optional filters
router.get('/', async (req, res) => {
  try {
    // Reset completed daily tasks if a new day has started
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    await Task.updateMany(
      { isDaily: true, status: 'done', completedAt: { $lt: today } },
      { $set: { status: 'todo', completedAt: null } }
    );

    const { category, status, priority, search } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (search) filter.title = { $regex: search, $options: 'i' };

    const tasks = await Task.find(filter).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single task
router.get('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create task
router.post('/', async (req, res) => {
  try {
    const pointsMap = { low: 5, medium: 10, high: 20, urgent: 30 };
    const task = new Task({
      ...req.body,
      points: pointsMap[req.body.priority] || 10
    });
    const saved = await task.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update task
router.put('/:id', async (req, res) => {
  try {
    const existing = await Task.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Task not found' });

    const wasNotDone = existing.status !== 'done';
    const isNowDone = req.body.status === 'done';

    if (wasNotDone && isNowDone) {
      req.body.completedAt = new Date();
      // Award XP
      let gamification = await Gamification.findOne();
      if (!gamification) gamification = new Gamification();
      gamification.totalXP += existing.points;
      gamification.tasksCompleted += 1;
      gamification.calculateLevel();

      // Check if ALL tasks for today are now completed
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayEnd = new Date(todayStart);
      todayEnd.setDate(todayEnd.getDate() + 1);

      // Count remaining incomplete tasks:
      // - Daily tasks that are not done
      // - Non-daily tasks due today that are not done (excluding the one we just completed)
      const incompleteDailyCount = await Task.countDocuments({
        _id: { $ne: existing._id },
        isDaily: true,
        status: { $ne: 'done' }
      });
      const incompleteNonDailyTodayCount = await Task.countDocuments({
        _id: { $ne: existing._id },
        isDaily: false,
        status: { $ne: 'done' },
        dueDate: { $gte: todayStart, $lt: todayEnd }
      });

      const allTasksDone = (incompleteDailyCount + incompleteNonDailyTodayCount) === 0;

      if (allTasksDone) {
        // All tasks for today are done — advance the streak
        gamification.markAllTasksCompleted();
      } else {
        // Not all tasks done yet — just record activity
        gamification.recordActivity();
      }

      // Check achievements
      const achievementChecks = [
        { count: 1, name: 'First Step', desc: 'Complete your first task', icon: '🎯' },
        { count: 10, name: 'Getting Rolling', desc: 'Complete 10 tasks', icon: '🔥' },
        { count: 50, name: 'Productivity Pro', desc: 'Complete 50 tasks', icon: '⚡' },
        { count: 100, name: 'Century Club', desc: 'Complete 100 tasks', icon: '💯' },
      ];
      for (const ach of achievementChecks) {
        if (gamification.tasksCompleted >= ach.count &&
            !gamification.achievements.find(a => a.name === ach.name)) {
          gamification.achievements.push({ name: ach.name, description: ach.desc, icon: ach.icon });
        }
      }
      await gamification.save();
    }

    const updated = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete task
router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
