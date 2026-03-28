const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

async function check() {
    await mongoose.connect(process.env.MONGODB_URI);
    const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({ name: String }));
    const Student = mongoose.models.Student || mongoose.model('Student', new mongoose.Schema({ user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, institute_id: mongoose.Schema.Types.ObjectId }));
    const Result = mongoose.models.Result || mongoose.model('Result', new mongoose.Schema({ student_id: mongoose.Schema.Types.ObjectId, marks: Number, test_id: mongoose.Schema.Types.ObjectId }));
    const Test = mongoose.models.Test || mongoose.model('Test', new mongoose.Schema({ name: String, date: Date }));
    
    console.log('--- ALL STUDENTS ---');
    const students = await Student.find().populate('user_id').limit(10);
    for (const s of students) {
        console.log('Student:', s.user_id?.name, 'ID:', s._id);
        const results = await Result.find({ student_id: s._id }).populate('test_id');
        console.log('  Count:', results.length);
        results.forEach(r => {
            console.log('  Test:', r.test_id?.name, 'Date:', r.test_id?.date, 'Marks:', r.marks);
        });
    }
    process.exit(0);
}
check();
