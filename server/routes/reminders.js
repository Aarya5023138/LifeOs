const express = require('express');
const router = express.Router();
const Reminder = require('../models/Reminder');

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
