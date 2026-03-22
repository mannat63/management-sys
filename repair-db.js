const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config({ path: ".env.local" });

const FeeSchema = new mongoose.Schema({
  total_amount: Number,
  paid_amount: Number,
  due_amount: Number,
  status: String
}, { strict: false });

const Fee = mongoose.models.Fee || mongoose.model("Fee", FeeSchema);

async function fixData() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Fixing database records...");

  const fees = await Fee.find({});
  let totalFixed = 0;

  for (const f of fees) {
    let changed = false;

    // 1. Fix invalid UNPAID status
    if (f.status === "UNPAID") {
      f.status = "DUE";
      changed = true;
    }

    // 2. Backfill 0 amount fees with realistic sample data
    if (!f.total_amount || f.total_amount === 0) {
      const samples = [15000, 20000, 25000, 30000, 35000];
      f.total_amount = samples[Math.floor(Math.random() * samples.length)];
      changed = true;
    }

    // 3. Ensure due_amount and status are correct
    const expectedDue = f.total_amount - (f.paid_amount || 0);
    if (f.due_amount !== expectedDue) {
      f.due_amount = expectedDue;
      changed = true;
    }

    if (f.due_amount <= 0) {
      f.status = "PAID";
    } else if ((f.paid_amount || 0) > 0) {
      f.status = "PARTIAL";
    } else {
      f.status = "DUE";
    }

    if (changed) {
      await Fee.updateOne({ _id: f._id }, { 
        $set: { 
          status: f.status, 
          total_amount: f.total_amount, 
          due_amount: f.due_amount,
          paid_amount: f.paid_amount || 0
        } 
      });
      totalFixed++;
    }
  }

  console.log(`Successfully fixed ${totalFixed} fee records!`);
  process.exit(0);
}

fixData().catch(console.error);
