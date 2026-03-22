const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const Attendance = mongoose.model('Attendance', new mongoose.Schema({
    date: Date,
    status: String,
    institute_id: mongoose.Schema.Types.ObjectId
  }));

  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const todayUTC = new Date(now.getTime() + istOffset);
  todayUTC.setUTCHours(0, 0, 0, 0);

  console.log('Now:', now.toISOString());
  console.log('Today IST (Calculated):', todayUTC.toISOString());

  const records = await Attendance.find({ date: { $gte: new Date("2026-03-20"), $lte: new Date("2026-03-23") } });
  console.log('Attendance Records around now:');
  records.forEach(r => {
    console.log(`- Date: ${r.date.toISOString()}, Status: ${r.status}`);
  });

  process.exit(0);
}
check();
