const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  content: {
    type: String,
    default: '',
  },
  isPinned: {
    type: Boolean,
    default: false,
  },
  color: {
    type: String,
    default: '#1a1a2e',
  },
}, { timestamps: true });

module.exports = mongoose.model('Note', noteSchema);
