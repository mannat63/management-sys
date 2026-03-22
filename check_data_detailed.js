const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const Attendance = mongoose.model('Attendance', new mongoose.Schema({
    date: Date,
    status: String,
    institute_id: mongoose.Schema.Types.ObjectId,
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' }
  }));
  const Student = mongoose.model('Student', new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }));
  const User = mongoose.model('User', new mongoose.Schema({ name: String }));

  const records = await Attendance.find({ date: { $gte: new Date("2026-03-20"), $lte: new Date("2026-03-23") } })
    .populate({ path: 'student_id', populate: { path: 'user_id' } });

  console.log('Attendance Records Found:');
  records.forEach(r => {
    const name = r.student_id?.user_id?.name || 'Unknown';
    console.log(`- Date: ${r.date.toISOString()}, Name: ${name}, Status: ${r.status}`);
  });

  process.exit(0);
}
check();
