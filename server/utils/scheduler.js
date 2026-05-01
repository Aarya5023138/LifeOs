const Reminder = require('../models/Reminder');

async function processRecurringReminders() {
  try {
    const now = new Date();
    const activeReminders = await Reminder.find({
      isActive: true,
      isRecurring: true,
      dateTime: { $lte: now },
    });

    for (const reminder of activeReminders) {
      const nextDate = new Date(reminder.dateTime);
      
      switch (reminder.recurringPattern) {
        case 'daily':
          nextDate.setDate(nextDate.getDate() + 1);
          break;
        case 'weekly':
          nextDate.setDate(nextDate.getDate() + 7);
          break;
        case 'monthly':
          nextDate.setMonth(nextDate.getMonth() + 1);
          break;
        case 'yearly':
          nextDate.setFullYear(nextDate.getFullYear() + 1);
          break;
        default:
          continue;
      }
      
      reminder.dateTime = nextDate;
      reminder.lastTriggered = now;
      await reminder.save();
    }
  } catch (err) {
    console.error('Scheduler error:', err.message);
  }
}

module.exports = { processRecurringReminders };
