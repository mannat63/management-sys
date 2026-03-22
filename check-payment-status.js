const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config({ path: ".env.local" });

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to DB");

  const fees = await mongoose.connection.db.collection("fees").find({}).toArray();
  const payments = await mongoose.connection.db.collection("payments").find({}).toArray();

  console.log("\n--- Fees ---");
  fees.forEach(f => {
    console.log(`ID: ${f._id.toString()}, Total: ${f.total_amount}, Paid: ${f.paid_amount}, Due: ${f.due_amount}, Status: ${f.status}`);
  });

  console.log("\n--- Payments ---");
  payments.forEach(p => {
    console.log(`ID: ${p._id.toString()}, FeeID: ${p.fee_id.toString()}, Amount: ${p.amount}, Status: ${p.status}`);
  });

  process.exit();
}

check().catch(err => {
  console.error(err);
  process.exit(1);
});
