const express = require('express');
const router = express.Router();
const Habit = require('../models/Habit');

// Get all habits
router.get('/', async (req, res) => {
  try {
    const habits = await Habit.find().sort({ createdAt: -1 });
    res.json(habits);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new habit
router.post('/', async (req, res) => {
  try {
    const habit = new Habit(req.body);
    const saved = await habit.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update a habit
router.put('/:id', async (req, res) => {
  try {
    const habit = await Habit.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!habit) return res.status(404).json({ error: 'Habit not found' });
    res.json(habit);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Toggle a date completion for a habit
router.post('/:id/toggle', async (req, res) => {
  try {
    const { date } = req.body; // YYYY-MM-DD
    if (!date) return res.status(400).json({ error: 'Date is required' });

    const habit = await Habit.findById(req.params.id);
    if (!habit) return res.status(404).json({ error: 'Habit not found' });

    const idx = habit.completedDates.indexOf(date);
    if (idx > -1) {
      habit.completedDates.splice(idx, 1); // un-complete
    } else {
      habit.completedDates.push(date); // complete
    }
    const saved = await habit.save();
    res.json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete a habit
router.delete('/:id', async (req, res) => {
  try {
    const habit = await Habit.findByIdAndDelete(req.params.id);
    if (!habit) return res.status(404).json({ error: 'Habit not found' });
    res.json({ message: 'Habit deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
