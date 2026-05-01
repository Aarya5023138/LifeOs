const mongoose = require('mongoose');
const Gamification = require('./models/Gamification');

async function testStreak() {
  await mongoose.connect('mongodb://127.0.0.1:27017/lifeos', { serverSelectionTimeoutMS: 3000 }).catch(async () => {
    console.log("Using in memory db instead? Actually I shouldn't need a real db to test methods if I just instantiate a doc.");
  });
  
  const doc = new Gamification();
  
  console.log("Initial state:", doc.currentStreak, doc.lastActiveDate);
  
  // Fake day 1
  const day1 = new Date('2026-04-20T10:00:00Z');
  doc.updateStreakTest = function(now) {
    const lastActive = this.lastActiveDate ? new Date(this.lastActiveDate) : null;
    if (!lastActive) {
      this.currentStreak = 1;
    } else {
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const lastActiveStart = new Date(lastActive.getFullYear(), lastActive.getMonth(), lastActive.getDate());
      const diffDays = Math.round((todayStart - lastActiveStart) / (1000 * 60 * 60 * 24));
      
      console.log(`Comparing ${todayStart.toISOString()} with ${lastActiveStart.toISOString()} -> diffDays: ${diffDays}`);
      
      if (diffDays === 1) {
        this.currentStreak += 1;
      } else if (diffDays > 1) {
        this.currentStreak = 1;
      }
    }
    if (this.currentStreak > this.longestStreak) {
      this.longestStreak = this.currentStreak;
    }
    this.lastActiveDate = now;
  };
  
  doc.updateStreakTest(day1);
  console.log("After day 1:", doc.currentStreak);
  
  // Fake day 1 again
  const day1_later = new Date('2026-04-20T15:00:00Z');
  doc.updateStreakTest(day1_later);
  console.log("After day 1 later:", doc.currentStreak);
  
  // Fake day 2
  const day2 = new Date('2026-04-21T09:00:00Z');
  doc.updateStreakTest(day2);
  console.log("After day 2:", doc.currentStreak);
  
  // Fake day 4 (skip day 3)
  const day4 = new Date('2026-04-23T08:00:00Z');
  doc.updateStreakTest(day4);
  console.log("After day 4 (skipped a day):", doc.currentStreak);
  
  process.exit(0);
}

testStreak();
