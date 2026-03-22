import mongoose from "mongoose";
import * as dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env.local") });

// Models
const userSchema = new mongoose.Schema({}, { strict: false, collection: "users" });
const User = mongoose.models.User || mongoose.model("User", userSchema);

async function fixDuplicates() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB");

  const users = await User.find({}).lean();
  const byEmail = {};
  
  for (const u of users) {
    const email = u.phoneOrEmail?.toLowerCase();
    if (!email) continue;
    if (!byEmail[email]) byEmail[email] = [];
    byEmail[email].push(u);
  }

  for (const [email, records] of Object.entries(byEmail)) {
    if (records.length > 1) {
      console.log(`Found duplicate users for ${email}. Fixing...`);

      const oneWithClerk = records.find(r => r.clerk_id);
      const preCreated = records.find(r => !r.clerk_id);

      if (oneWithClerk && preCreated) {
        console.log(`- Pre-created ID (Linked): ${preCreated._id}`);
        console.log(`- Auto-provisioned ID (Clerk): ${oneWithClerk._id}`);

        // Delete the auto-provisioned one FIRST to avoid duplicate key error
        await User.deleteOne({ _id: oneWithClerk._id });
        console.log(`-> Deleted auto-provisioned dangling user.`);

        // Update preCreated with the clerk_id
        await User.updateOne({ _id: preCreated._id }, { $set: { clerk_id: oneWithClerk.clerk_id } });
        console.log(`-> Copied clerk_id to Pre-created user.`);
      } else {
        console.log(`- Edge case. Requires manual review:`, records.map(r => ({ id: r._id, clerk: !!r.clerk_id })));
      }
    }
  }

  console.log("Done fixing users.");
  process.exit(0);
}

fixDuplicates().catch(console.error);
