const express = require('express');
const router = express.Router();
const Reminder = require('../models/Reminder');

// Helper: advance dateTime for recurring reminders
function nextDateTime(date, pattern) {
  const d = new Date(date);
  switch (pattern) {
    case 'daily':   d.setDate(d.getDate() + 1); break;
    case 'weekly':  d.setDate(d.getDate() + 7); break;
    case 'monthly': d.setMonth(d.getMonth() + 1); break;
    case '3month':  d.setMonth(d.getMonth() + 3); break;
    case '6month':  d.setMonth(d.getMonth() + 6); break;
    case 'yearly':  d.setFullYear(d.getFullYear() + 1); break;
    default: return null;
  }
  return d;
}

// Get all reminders
router.get('/', async (req, res) => {
  try {
    const { active } = req.query;
    const filter = {};
    if (active !== undefined) filter.isActive = active === 'true';
    const reminders = await Reminder.find(filter).populate('linkedTask').sort({ dateTime: 1 });
    res.json(reminders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get due (fired) reminders – client polls this every 30s
// Returns reminders that are due and not yet notified, then marks them
router.get('/due', async (req, res) => {
  try {
    const now = new Date();
    const due = await Reminder.find({
      isActive: true,
      notified: false,
      dateTime: { $lte: now },
    });

    // Mark them notified and advance recurring ones
    for (const r of due) {
      if (r.isRecurring && r.recurringPattern !== 'none') {
        const next = nextDateTime(r.dateTime, r.recurringPattern);
        if (next) {
          r.dateTime = next;
          r.notified = false;
        } else {
          r.notified = true;
        }
      } else {
        r.notified = true;
        r.isActive = false;
      }
      r.lastTriggered = now;
      await r.save();
    }

    res.json(due);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create reminder
router.post('/', async (req, res) => {
  try {
    const reminder = new Reminder(req.body);
    const saved = await reminder.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update reminder
router.put('/:id', async (req, res) => {
  try {
    const updated = await Reminder.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: 'Reminder not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete reminder
router.delete('/:id', async (req, res) => {
  try {
    const reminder = await Reminder.findByIdAndDelete(req.params.id);
    if (!reminder) return res.status(404).json({ error: 'Reminder not found' });
    res.json({ message: 'Reminder deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
