const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config({ path: ".env.local" });

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to DB");

  const students = await mongoose.connection.db.collection("students").find({}).toArray();

  if (students.length > 0) {
    console.log("First Student Record:");
    console.log(JSON.stringify(students[0], null, 2));
  } else {
    console.log("No students found.");
  }

  process.exit();
}

check().catch(err => {
  console.error(err);
  process.exit(1);
});
