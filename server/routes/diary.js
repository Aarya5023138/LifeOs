const express = require('express');
const router = express.Router();
const DiaryEntry = require('../models/DiaryEntry');
const Gamification = require('../models/Gamification');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// Get all diary entries
router.get('/', async (req, res) => {
  try {
    const { mood, startDate, endDate } = req.query;
    const filter = {};
    if (mood) filter.mood = mood;
    if (startDate && endDate) {
      filter.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    const entries = await DiaryEntry.find(filter).sort({ date: -1 });
    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get mood stats
router.get('/mood-stats', async (req, res) => {
  try {
    const stats = await DiaryEntry.aggregate([
      { $group: { _id: '$mood', count: { $sum: 1 }, avgScore: { $avg: '$moodScore' } } },
      { $sort: { count: -1 } }
    ]);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create diary entry
router.post('/', upload.array('attachments', 5), async (req, res) => {
  try {
    const moodScoreMap = { amazing: 5, happy: 4, neutral: 3, sad: 2, terrible: 1 };
    
    // Process files
    const newAttachments = req.files ? req.files.map(f => `/uploads/${f.filename}`) : [];
    
    // Body might be JSON or form-data
    const tags = req.body.tags ? (typeof req.body.tags === 'string' ? req.body.tags.split(',') : req.body.tags) : [];

    const entry = new DiaryEntry({
      ...req.body,
      tags,
      attachments: newAttachments,
      moodScore: moodScoreMap[req.body.mood] || 3
    });
    const saved = await entry.save();

    // Award XP for diary entry
    let gamification = await Gamification.findOne();
    if (!gamification) gamification = new Gamification();
    gamification.totalXP += 15;
    gamification.diaryEntries += 1;
    gamification.calculateLevel();
    gamification.recordActivity();

    // Achievement check
    const diaryAchievements = [
      { count: 1, name: 'Dear Diary', desc: 'Write your first diary entry', icon: '📝' },
      { count: 7, name: 'Week of Reflection', desc: 'Write 7 diary entries', icon: '📖' },
      { count: 30, name: 'Monthly Chronicler', desc: 'Write 30 diary entries', icon: '📚' },
    ];
    for (const ach of diaryAchievements) {
      if (gamification.diaryEntries >= ach.count &&
          !gamification.achievements.find(a => a.name === ach.name)) {
        gamification.achievements.push({ name: ach.name, description: ach.desc, icon: ach.icon });
      }
    }
    await gamification.save();

    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update diary entry
router.put('/:id', upload.array('attachments', 5), async (req, res) => {
  try {
    const moodScoreMap = { amazing: 5, happy: 4, neutral: 3, sad: 2, terrible: 1 };
    const updateData = { ...req.body };
    if (updateData.mood) updateData.moodScore = moodScoreMap[updateData.mood] || 3;
    
    if (typeof updateData.tags === 'string') updateData.tags = updateData.tags.split(',');
    
    if (req.files && req.files.length > 0) {
      const newAttachments = req.files.map(f => `/uploads/${f.filename}`);
      // Parse potentially existing attachments sent as JSON/form string
      const existing = updateData.existingAttachments ? JSON.parse(updateData.existingAttachments) : [];
      updateData.attachments = [...existing, ...newAttachments];
    } else if (updateData.existingAttachments) {
       updateData.attachments = JSON.parse(updateData.existingAttachments);
    }

    const updated = await DiaryEntry.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!updated) return res.status(404).json({ error: 'Entry not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete diary entry
router.delete('/:id', async (req, res) => {
  try {
    const entry = await DiaryEntry.findByIdAndDelete(req.params.id);
    if (!entry) return res.status(404).json({ error: 'Entry not found' });
    res.json({ message: 'Entry deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
