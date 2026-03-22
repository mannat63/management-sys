import mongoose from "mongoose";
import * as dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env.local") });

async function fix() {
  await mongoose.connect(process.env.MONGODB_URI);
  const User = mongoose.connection.collection("users");
  const Student = mongoose.connection.collection("students");

  const adminUsers = await User.find({ phoneOrEmail: /campervictor52/i }).toArray();
  for (const admin of adminUsers) {
    console.log("Admin user found:", admin._id);
    await User.updateOne({ _id: admin._id }, { $set: { role: "ADMIN" } });
    
    // An admin should never have a Student record assigned to them representing themselves
    const delRes = await Student.deleteMany({ user_id: admin._id });
    console.log("Deleted dummy student records:", delRes.deletedCount);
  }
  process.exit();
}
fix().catch(console.error);
