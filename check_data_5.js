const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');

async function run(){ 
  await mongoose.connect(process.env.MONGODB_URI); 
  const Att = mongoose.model('Attendance', new mongoose.Schema({ date: Date, status: String, student_id: {type: mongoose.Schema.Types.ObjectId, ref: 'Student'}, batch_id: {type: mongoose.Schema.Types.ObjectId, ref: 'Batch'} }), 'attendances'); 
  const Student = mongoose.model('Student', new mongoose.Schema({ user_id: {type: mongoose.Schema.Types.ObjectId, ref: 'User'}, parent_name: String }), 'students');
  const Batch = mongoose.model('Batch', new mongoose.Schema({ name: String }), 'batches');
  const User = mongoose.model('User', new mongoose.Schema({ name: String }), 'users');

  const atts = await Att.find({date: {$gte: new Date("2026-03-20")}}).populate({path: 'student_id', populate: {path:'user_id'}}).populate('batch_id'); 
  
  let out = [];
  atts.forEach(x => {
    const sName = x.student_id?.user_id?.name || x.student_id?.parent_name || 'Unknown';
    out.push(`${x.date.toISOString().split('T')[0]} ${sName} ${x.status}`);
  });
  
  fs.writeFileSync('att_dump.txt', out.join('\n'));
  process.exit(0); 
} 
run();
