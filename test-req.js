async function test() {
  try {
    const res = await fetch('http://localhost:5001/api/reminders', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: 'Test',
        description: 'test desc',
        date: '2026-04-17',
        time: '12:00',
        dateTime: '2026-04-17T12:00:00.000Z',
        isRecurring: false,
        recurringPattern: 'none'
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(JSON.stringify(data));
    console.log('Reminder success:', data);
  } catch (err) {
    console.log('Reminder error:', err.message);
  }

  try {
    const res2 = await fetch('http://localhost:5001/api/calendar', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: 'Test Event',
          description: 'test desc',
          date: '2026-04-17',
          type: 'other',
          color: '#000000',
          isRecurring: false,
          recurringRule: 'none',
          allDay: true
        })
    });
    const data2 = await res2.json();
    if (!res2.ok) throw new Error(JSON.stringify(data2));
    console.log('Calendar success:', data2);
  } catch (err) {
    console.log('Calendar error:', err.message);
  }
}
test();
