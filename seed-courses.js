const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config({ path: ".env.local" });

const CourseSchema = new mongoose.Schema({
  name: String,
  description: String,
  base_fee: Number,
  institute_id: mongoose.Schema.Types.ObjectId
}, { strict: false });

const Course = mongoose.models.Course || mongoose.model("Course", CourseSchema);

async function fixCourses() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Adding sample data to courses...");

  const courses = await Course.find({});
  let totalFixed = 0;

  for (const c of courses) {
    if (c.name.toLowerCase().includes("jee")) {
      await Course.updateOne({ _id: c._id }, { 
        $set: { 
          description: "Enroll in the best JEE course in the city with top-tier professionals. Comprehensive training for Mains & Advanced with mock tests.",
          base_fee: 45000 
        } 
      });
      totalFixed++;
    } else if (c.name.toLowerCase().includes("10th") || c.name.toLowerCase().includes("class 10")) {
      await Course.updateOne({ _id: c._id }, { 
        $set: { 
          description: "High-impact foundation course for Class 10 Students. Focus on Science, Math and board exam mastery with weekly assessments.",
          base_fee: 25000 
        } 
      });
      totalFixed++;
    } else {
      // Default sample
      await Course.updateOne({ _id: c._id }, { 
        $set: { 
          description: "Expert led training programs designed for academic excellence and conceptual clarity across all core subjects.",
          base_fee: 30000 
        } 
      });
      totalFixed++;
    }
  }

  console.log(`Successfully updated ${totalFixed} courses with sample descriptions and fees!`);
  process.exit(0);
}

fixCourses().catch(console.error);
