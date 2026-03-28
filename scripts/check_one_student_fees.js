const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

async function check() {
    await mongoose.connect(process.env.MONGODB_URI);
    const Fee = mongoose.models.Fee || mongoose.model('Fee', new mongoose.Schema({ student_id: mongoose.Schema.Types.ObjectId, due_amount: Number, due_date: Date }));
    const Student = mongoose.models.Student || mongoose.model('Student', new mongoose.Schema({ institute_id: mongoose.Schema.Types.ObjectId, name: String }));
    const oneStudent = await Student.findOne();
    if (oneStudent) {
        console.log('FEE RECORDS FOR', oneStudent.name);
        const fees = await Fee.find({ student_id: oneStudent._id });
        console.log(JSON.stringify(fees, null, 2));
    }
    process.exit(0);
}
check();
