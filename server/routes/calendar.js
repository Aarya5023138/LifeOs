const express = require('express');
const router = express.Router();
const CalendarEvent = require('../models/CalendarEvent');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/', async (req, res) => {
  try {
    const { start, end, type } = req.query;
    const filter = { userId: req.userId };
    if (start && end) filter.date = { $gte: new Date(start), $lte: new Date(end) };
    if (type) filter.type = type;
    const events = await CalendarEvent.find(filter).sort({ date: 1 });
    res.json(events);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const event = new CalendarEvent({ ...req.body, userId: req.userId });
    const saved = await event.save();
    res.status(201).json(saved);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const updated = await CalendarEvent.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId }, req.body, { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Event not found' });
    res.json(updated);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const event = await CalendarEvent.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json({ message: 'Event deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
