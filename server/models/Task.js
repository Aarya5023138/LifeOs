const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  category: { type: String, enum: ['personal', 'work'], default: 'personal' },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  status: { type: String, enum: ['todo', 'in-progress', 'done'], default: 'todo' },
  dueDate: { type: Date },
  isDaily: { type: Boolean, default: false },
  tags: [{ type: String }],
  points: { type: Number, default: 10 },
  completedAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);
