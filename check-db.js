const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config({ path: ".env.local" });

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to DB");

  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();
  console.log("Collections in DB:", collections.map(c => c.name));

  for (const c of collections) {
    const count = await db.collection(c.name).countDocuments();
    console.log(`- ${c.name}: ${count}`);
  }

  process.exit();
}

check().catch(err => {
  console.error(err);
  process.exit(1);
});
