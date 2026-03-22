import mongoose from "mongoose";
import * as dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env.local") });

async function fix() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB");

  const User = mongoose.connection.collection("users");
  const Student = mongoose.connection.collection("students");
  const Result = mongoose.connection.collection("results");
  const Attendance = mongoose.connection.collection("attendances");
  const Fee = mongoose.connection.collection("fees");

  // Get active user with Clerk ID
  const activeUser = await User.findOne({ phoneOrEmail: /hackareg07/i, clerk_id: { $exists: true, $ne: null } });
  if (!activeUser) {
    console.log("No active user found!");
    process.exit(1);
  }
  
  // Find all dummy users created by Admin manual entry
  const dummyUsers = await User.find({ phoneOrEmail: /hackareg07/i, clerk_id: null }).toArray();
  const dummyUserIds = dummyUsers.map(u => u._id);

  if (dummyUserIds.length > 0) {
    console.log("Found dummy users. Remapping their Student records to the active User...");

    // Find all student records belonging to these dummies
    const dummyStudents = await Student.find({ user_id: { $in: dummyUserIds } }).toArray();
    
    if (dummyStudents.length > 0) {
      // Pick the first one as the "winner" and delete the rest
      const winningStudent = dummyStudents[0];
      const duplicateStudents = dummyStudents.slice(1);
      
      // Map winner to Active User
      await Student.updateOne(
        { _id: winningStudent._id },
        { $set: { user_id: activeUser._id } }
      );
      console.log(`Linked winning Student ${winningStudent._id} to Active User ${activeUser._id}.`);

      // If there were duplicates, map their dependencies to the winner, then delete them
      for (const dup of duplicateStudents) {
        await Result.updateMany({ student_id: dup._id }, { $set: { student_id: winningStudent._id } });
        await Attendance.updateMany({ student_id: dup._id }, { $set: { student_id: winningStudent._id } });
        await Fee.updateMany({ student_id: dup._id }, { $set: { student_id: winningStudent._id } });
        await Student.deleteOne({ _id: dup._id });
        console.log(`Deleted duplicate Student ${dup._id} and remapped dependencies.`);
      }
    }

    // Now delete the dummy users
    await User.deleteMany({ _id: { $in: dummyUserIds } });
    console.log(`Deleted ${dummyUserIds.length} dummy User records.`);
  }

  // Ensure active user role is explicitly STUDENT
  await User.updateOne({ _id: activeUser._id }, { $set: { role: "STUDENT" } });

  console.log("Repair completed successfully.");
  process.exit();
}

fix().catch(console.error);
