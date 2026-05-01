const express = require('express');
const router = express.Router();
const CalendarEvent = require('../models/CalendarEvent');

// Get all events (optional date range filter)
router.get('/', async (req, res) => {
  try {
    const { start, end, type } = req.query;
    const filter = {};
    if (start && end) {
      filter.date = { $gte: new Date(start), $lte: new Date(end) };
    }
    if (type) filter.type = type;
    const events = await CalendarEvent.find(filter).sort({ date: 1 });
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create event
router.post('/', async (req, res) => {
  try {
    const event = new CalendarEvent(req.body);
    const saved = await event.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update event
router.put('/:id', async (req, res) => {
  try {
    const updated = await CalendarEvent.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: 'Event not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete event
router.delete('/:id', async (req, res) => {
  try {
    const event = await CalendarEvent.findByIdAndDelete(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json({ message: 'Event deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
