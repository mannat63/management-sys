const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config({ path: ".env.local" });

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to DB");

  const users = await mongoose.connection.db.collection("users").find({}).toArray();
  const institutes = await mongoose.connection.db.collection("institutes").find({}).toArray();
  const students = await mongoose.connection.db.collection("students").find({}).toArray();
  const fees = await mongoose.connection.db.collection("fees").find({}).toArray();

  console.log("\n--- Institutes ---");
  institutes.forEach(i => {
    console.log(`ID: ${i._id.toString()}, Name: ${i.name}`);
  });

  console.log("\n--- Users ---");
  users.forEach(u => {
    console.log(`ID: ${u._id.toString()}, Name: ${u.name}, Role: ${u.role}, Inst: ${u.institute_id ? u.institute_id.toString() : "NULL"}`);
  });

  console.log("\n--- Students ---");
  students.forEach(s => {
    console.log(`ID: ${s._id.toString()}, User: ${s.user_id ? s.user_id.toString() : "NULL"}, Name: ${s.parent_name}, Inst: ${s.institute_id ? s.institute_id.toString() : "NULL"}`);
  });

  console.log("\n--- Fees ---");
  fees.forEach(f => {
    console.log(`ID: ${f._id.toString()}, Student: ${f.student_id ? f.student_id.toString() : "NULL"}, Inst: ${f.institute_id ? f.institute_id.toString() : "NULL"}`);
  });

  process.exit();
}

check().catch(err => {
  console.error(err);
  process.exit(1);
});
