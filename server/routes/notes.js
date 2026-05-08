const express = require('express');
const router = express.Router();
const Note = require('../models/Note');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/', async (req, res) => {
  try {
    const notes = await Note.find({ userId: req.userId }).sort({ isPinned: -1, updatedAt: -1 });
    res.json(notes);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/', async (req, res) => {
  const note = new Note({
    userId: req.userId,
    title: req.body.title,
    content: req.body.content,
    isPinned: req.body.isPinned,
    color: req.body.color
  });
  try {
    const newNote = await note.save();
    res.status(201).json(newNote);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, userId: req.userId });
    if (!note) return res.status(404).json({ message: 'Note not found' });
    if (req.body.title != null) note.title = req.body.title;
    if (req.body.content != null) note.content = req.body.content;
    if (req.body.isPinned != null) note.isPinned = req.body.isPinned;
    if (req.body.color != null) note.color = req.body.color;
    const updatedNote = await note.save();
    res.json(updatedNote);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!note) return res.status(404).json({ message: 'Note not found' });
    res.json({ message: 'Note deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
