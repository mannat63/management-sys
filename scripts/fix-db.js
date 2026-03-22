import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function fix() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("No MONGODB_URI");
  
  await mongoose.connect(uri);
  console.log("Connected to MongoDB");
  
  try {
    const collection = mongoose.connection.collection("users");
    console.log("Dropping problematic index authId_1...");
    await collection.dropIndex("authId_1");
    console.log("Successfully dropped authId_1");
  } catch (e) {
    if (e.code === 27) {
      console.log("Index authId_1 doesn't exist, skipping.");
    } else {
      console.error(e);
    }
  }

  process.exit(0);
}

fix();
