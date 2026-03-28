const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

async function check() {
    await mongoose.connect(process.env.MONGODB_URI);
    const Student = mongoose.models.Student || mongoose.model('Student', new mongoose.Schema({ name: String }));
    const Result = mongoose.models.Result || mongoose.model('Result', new mongoose.Schema({ student_id: mongoose.Schema.Types.ObjectId, marks: Number, test_id: mongoose.Schema.Types.ObjectId }));
    const Test = mongoose.models.Test || mongoose.model('Test', new mongoose.Schema({ name: String, date: Date }));
    
    console.log('--- ALL STUDENTS ---');
    const students = await Student.find().limit(5);
    for (const s of students) {
        console.log('Student:', s.name, 'ID:', s._id);
        const results = await Result.find({ student_id: s._id }).populate('test_id');
        console.log('  Count:', results.length);
        results.forEach(r => {
            console.log('  Test:', r.test_id?.name, 'Date:', r.test_id?.date, 'Marks:', r.marks);
        });
    }
    process.exit(0);
}
check();
