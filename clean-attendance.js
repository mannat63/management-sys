import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function clean() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to DB");

  const records = await mongoose.connection.db.collection("attendances").find({}).toArray();
  const seen = new Set();
  let duplicates = 0;

  for (const r of records) {
    if (!r.student_id || !r.batch_id || !r.date) continue;
    
    // Normalize date to midnight UTC string for comparison
    const d = new Date(r.date);
    d.setUTCHours(0, 0, 0, 0);
    const key = `${r.student_id.toString()}_${r.batch_id.toString()}_${d.toISOString()}`;
    
    if (seen.has(key)) {
      await mongoose.connection.db.collection("attendances").deleteOne({ _id: r._id });
      duplicates++;
      console.log(`Deleted duplicate: ${key}`);
    } else {
      seen.add(key);
      // We also update the record to ensure the date is exactly midnight UTC
      if (r.date.getTime() !== d.getTime()) {
        await mongoose.connection.db.collection("attendances").updateOne(
          { _id: r._id },
          { $set: { date: d } }
        );
      }
    }
  }

  console.log(`Cleanup complete. Removed ${duplicates} duplicates.`);
  process.exit();
}

clean();
