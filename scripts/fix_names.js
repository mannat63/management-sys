const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

async function clearWrongNames() {
    await mongoose.connect(process.env.MONGODB_URI);
    const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({ name: String, phoneOrEmail: String, role: String }));
    const Student = mongoose.models.Student || mongoose.model('Student', new mongoose.Schema({ user_id: mongoose.Schema.Types.ObjectId, parent_name: String }));

    // Let auth.js pull real name from Google by clearing the hardcoded names
    console.log("Clearing name for coachman...");
    await User.updateOne({ phoneOrEmail: 'coachman9606@gmail.com' }, { name: "" });

    console.log("Clearing name for camper...");
    await User.updateOne({ phoneOrEmail: 'campervictor52@gmail.com' }, { name: "" });

    // Ensure Camper's parent name is correct if he's already in the DB
    const camper = await User.findOne({ phoneOrEmail: 'campervictor52@gmail.com' });
    if (camper) {
        await Student.updateOne({ user_id: camper._id }, { parent_name: "Mr. Camper" });
        console.log("Updated Parent name for Camper in DB.");
    }
    
    console.log("Done.");
    process.exit(0);
}

clearWrongNames().catch(console.error);
