const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

async function check() {
    await mongoose.connect(process.env.MONGODB_URI);
    const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({ name: String, phoneOrEmail: String, institute_id: mongoose.Schema.Types.ObjectId }));
    const user = await User.findOne({ phoneOrEmail: 'coachman9606@gmail.com' }); // User used in previous sessions
    if (!user) {
        console.log('No Victor Camper found by email. Trying by name...');
        const userByName = await User.findOne({ name: /Victor/i });
        console.log('UserByName:', userByName?.name, 'Email:', userByName?.phoneOrEmail, 'Inst ID:', userByName?.institute_id);
    } else {
        console.log('User:', user.name, 'Email:', user.phoneOrEmail, 'Inst ID:', user.institute_id);
    }
    
    const Inst = mongoose.models.Institute || mongoose.model('Institute', new mongoose.Schema({ name: String }));
    const inst = await Inst.findOne({ name: 'Alpha Coaching' });
    console.log('Alpha Coaching Inst ID:', inst?._id);
    
    process.exit(0);
}
check();
