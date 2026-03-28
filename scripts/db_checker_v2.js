const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

async function check() {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Minimal schemas to avoid issues
    const Inst = mongoose.models.Institute || mongoose.model('Institute', new mongoose.Schema({ name: String }));
    const Student = mongoose.models.Student || mongoose.model('Student', new mongoose.Schema({ institute_id: mongoose.Schema.Types.ObjectId, name: String }));
    const Test = mongoose.models.Test || mongoose.model('Test', new mongoose.Schema({ institute_id: mongoose.Schema.Types.ObjectId, name: String, date: Date }));
    const Result = mongoose.models.Result || mongoose.model('Result', new mongoose.Schema({ institute_id: mongoose.Schema.Types.ObjectId, marks: Number }));
    const Fee = mongoose.models.Fee || mongoose.model('Fee', new mongoose.Schema({ institute_id: mongoose.Schema.Types.ObjectId, due_amount: Number, due_date: Date }));
    
    const inst = await Inst.findOne({ name: 'Alpha Coaching' });
    if (!inst) { console.log('No Alpha Coaching found'); process.exit(0); }
    
    console.log('INSTITUTE:', inst.name, inst._id);
    
    const students = await Student.countDocuments({ institute_id: inst._id });
    const tests = await Test.countDocuments({ institute_id: inst._id });
    const results = await Result.countDocuments({ institute_id: inst._id });
    const fees = await Fee.countDocuments({ institute_id: inst._id });
    
    const overdueRes = await Fee.aggregate([
        { $match: { institute_id: inst._id, due_date: { $lte: new Date() }, due_amount: { $gt: 0 } } },
        { $group: { _id: null, total: { $sum: '$due_amount' } } }
    ]);
    
    console.log('Students:', students);
    console.log('Tests:', tests);
    console.log('Results:', results);
    console.log('Fees (Total Records):', fees);
    console.log('Overdue Amount:', overdueRes[0]?.total || 0);
    
    process.exit(0);
}

check();
