const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

async function check() {
    await mongoose.connect(process.env.MONGODB_URI);
    const Result = mongoose.models.Result || mongoose.model('Result', new mongoose.Schema({ student_id: mongoose.Schema.Types.ObjectId, marks: Number, test_id: mongoose.Schema.Types.ObjectId }));
    const Test = mongoose.models.Test || mongoose.model('Test', new mongoose.Schema({ name: String, date: Date }));
    const Student = mongoose.models.Student || mongoose.model('Student', new mongoose.Schema({ name: String }));
    
    const oneStudent = await Student.findOne();
    if (oneStudent) {
        console.log('RESULTS FOR', oneStudent.name);
        const results = await Result.find({ student_id: oneStudent._id }).populate('test_id');
        console.log(JSON.stringify(results, null, 2));
    }
    process.exit(0);
}
check();
