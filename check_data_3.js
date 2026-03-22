const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

async function run(){ 
  await mongoose.connect(process.env.MONGODB_URI); 
  const Fee = mongoose.model('Fee', new mongoose.Schema({ paid_amount: Number }), 'fees'); 
  const Payment = mongoose.model('Payment', new mongoose.Schema({ amount: Number, status: String }), 'payments'); 
  
  const f = await Fee.find(); 
  const p = await Payment.find(); 
  console.log('Fee paid_amount sum:', f.reduce((a,b)=>a+(b.paid_amount||0), 0)); 
  console.log('Payment amount sum:', p.reduce((a,b)=>b.status==='CONFIRMED'?a+(b.amount||0):a, 0)); 
  
  const Att = mongoose.model('Attendance', new mongoose.Schema({ date: Date, status: String }), 'attendances'); 
  const atts = await Att.find({date: {$gte: new Date('2026-03-20')}}); 
  console.log('Attendances:');
  atts.forEach(x => console.log(x.date.toISOString() + ' ' + x.status));
  process.exit(0); 
} 
run();
