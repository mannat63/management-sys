import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to DB");

  const users = await mongoose.connection.db.collection("users").find({}).toArray();
  const fees = await mongoose.connection.db.collection("fees").find({}).toArray();
  const students = await mongoose.connection.db.collection("students").find({}).toArray();
  const institutes = await mongoose.connection.db.collection("institutes").find({}).toArray();

  console.log(`Users: ${users.length}`);
  console.log(`Fees: ${fees.length}`);
  console.log(`Students: ${students.length}`);
  console.log(`Institutes: ${institutes.length}`);

  if (fees.length > 0) {
    console.log("First Fee Record:");
    console.log(JSON.stringify(fees[0], null, 2));
  }

  process.exit();
}

check();
