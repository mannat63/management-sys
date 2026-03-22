const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const Attendance = mongoose.model('Attendance');
  const Student = mongoose.model('Student');
  const User = mongoose.model('User');
  const Fee = mongoose.model('Fee');
  const Payment = mongoose.model('Payment');

  // get revenues
  const fees = await Fee.find();
  const payments = await Payment.find();
  const feeRevenue = fees.reduce((sum, f) => sum + f.paid_amount, 0);
  const paymentRevenue = payments.reduce((sum, p) => p.status === 'CONFIRMED' ? sum + p.amount : sum, 0);
  console.log(`Revenue via fees.paid_amount: ${feeRevenue}`);
  console.log(`Revenue via Payment collection: ${paymentRevenue}`);

  const records = await Attendance.find({ date: { $gte: new Date("2026-03-20"), $lte: new Date("2026-03-22") } })
    .populate({ path: 'student_id', populate: { path: 'user_id' } });

  console.log('Attendance:');
  records.forEach(r => {
    const name = r.student_id?.user_id?.name || 'Unknown';
    console.log(`${r.date.toISOString()} - ${name} - ${r.status}`);
  });

  process.exit(0);
}
check();
