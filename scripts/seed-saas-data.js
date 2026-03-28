const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { faker } = require('@faker-js/faker');

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

// -------------------------------------------------------------
// 1. Mongoose Models Setup (Exact match to models folder)
// -------------------------------------------------------------
const InstituteSchema = new mongoose.Schema({
  name: { type: String, required: true },
  owner_name: { type: String, required: true },
  phone: { type: String, required: true },
});

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phoneOrEmail: { type: String, required: true },
  role: { type: String, enum: ["ADMIN", "TEACHER", "STUDENT"], required: true },
  institute_id: { type: mongoose.Schema.Types.ObjectId, ref: "Institute", required: true },
});

const CourseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  base_fee: { type: Number, default: 0 },
  institute_id: { type: mongoose.Schema.Types.ObjectId, ref: "Institute", required: true },
});

const BatchSchema = new mongoose.Schema({
  name: { type: String, required: true },
  course_id: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
  teacher_id: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher", required: true },
  timing: { type: String, required: true },
  institute_id: { type: mongoose.Schema.Types.ObjectId, ref: "Institute", required: true },
});

const TeacherSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  institute_id: { type: mongoose.Schema.Types.ObjectId, ref: "Institute", required: true },
});

const StudentSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  batch_id: { type: mongoose.Schema.Types.ObjectId, ref: "Batch", required: true },
  parent_name: { type: String, required: true },
  parent_phone: { type: String, required: true },
  admission_date: { type: Date, default: Date.now },
  institute_id: { type: mongoose.Schema.Types.ObjectId, ref: "Institute", required: true },
});

const AttendanceSchema = new mongoose.Schema({
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
  batch_id: { type: mongoose.Schema.Types.ObjectId, ref: "Batch", required: true },
  date: { type: Date, required: true },
  status: { type: String, enum: ["PRESENT", "ABSENT", "LATE"], required: true },
  institute_id: { type: mongoose.Schema.Types.ObjectId, ref: "Institute", required: true },
});
AttendanceSchema.index({ student_id: 1, batch_id: 1, date: 1 }, { unique: true });

const FeeSchema = new mongoose.Schema({
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
  total_amount: { type: Number, required: true },
  paid_amount: { type: Number, default: 0 },
  due_amount: { type: Number, required: true },
  due_date: { type: Date, required: true },
  status: { type: String, enum: ["PAID", "PARTIAL", "DUE"], default: "DUE" },
  institute_id: { type: mongoose.Schema.Types.ObjectId, ref: "Institute", required: true },
});

// Auto-calculate status before saving (copied from models/Fee.js)
FeeSchema.pre("save", function (next) {
  this.due_amount = this.total_amount - this.paid_amount;
  if (this.due_amount <= 0) {
    this.status = "PAID";
    this.due_amount = 0;
  } else if (this.paid_amount > 0) {
    this.status = "PARTIAL";
  } else {
    this.status = "DUE";
  }
  next();
});

const TestSchema = new mongoose.Schema({
  name: { type: String, required: true },
  batch_id: { type: mongoose.Schema.Types.ObjectId, ref: "Batch", required: true },
  date: { type: Date, required: true },
  total_marks: { type: Number, required: true },
  institute_id: { type: mongoose.Schema.Types.ObjectId, ref: "Institute", required: true },
});

const ResultSchema = new mongoose.Schema({
  test_id: { type: mongoose.Schema.Types.ObjectId, ref: "Test", required: true },
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
  marks: { type: Number, required: true },
  institute_id: { type: mongoose.Schema.Types.ObjectId, ref: "Institute", required: true },
});

const Institute = mongoose.models.Institute || mongoose.model('Institute', InstituteSchema);
const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Course = mongoose.models.Course || mongoose.model('Course', CourseSchema);
const Batch = mongoose.models.Batch || mongoose.model('Batch', BatchSchema);
const Teacher = mongoose.models.Teacher || mongoose.model('Teacher', TeacherSchema);
const Student = mongoose.models.Student || mongoose.model('Student', StudentSchema);
const Attendance = mongoose.models.Attendance || mongoose.model('Attendance', AttendanceSchema);
const Fee = mongoose.models.Fee || mongoose.model('Fee', FeeSchema);
const TestModel = mongoose.models.Test || mongoose.model('Test', TestSchema);
const Result = mongoose.models.Result || mongoose.model('Result', ResultSchema);


// -------------------------------------------------------------
// 2. Data Generation Logic
// -------------------------------------------------------------
const CONFIG = {
  numStudents: 1000,
  numCourses: 5,
  numTeachers: 20,
  attendanceDays: 30, // Last 30 days
  testsPerBatch: 3,
};

async function seedDatabase() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI not found in environment variables. Have you set up .env.local?");
  
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  console.log('🌱 Connected to MongoDB. Clearing existing collections...');
  
  await Promise.all([
    Institute.deleteMany(), User.deleteMany(), Student.deleteMany(), Teacher.deleteMany(),
    Course.deleteMany(), Batch.deleteMany(), Attendance.deleteMany(), Fee.deleteMany(),
    TestModel.deleteMany(), Result.deleteMany()
  ]);

  console.log('✅ Collections cleared. Generating Core Entities...');

  // --- Institute ---
  const inst = new Institute({
    name: "Alpha Coaching",
    owner_name: "Victor Camper",
    phone: "+910000000000"
  });
  await inst.save();
  const I_ID = inst._id;

  // Admin
  await User.create({ name: 'Victor Camper', phoneOrEmail: 'campervictor52@gmail.com', role: 'ADMIN', institute_id: I_ID });

  // --- Courses ---
  const coursesRaw = [];
  for (let i = 0; i < CONFIG.numCourses; i++) {
    coursesRaw.push({
      name: `${faker.helpers.arrayElement(['JEE', 'NEET', 'Foundation', 'UPSC', 'GATE'])} - 202${faker.number.int({min:5, max:7})}`,
      description: faker.lorem.sentences(2),
      base_fee: faker.number.int({ min: 20000, max: 100000 }),
      institute_id: I_ID
    });
  }
  const insertedCourses = await Course.insertMany(coursesRaw);

  // --- Teachers ---
  const insertedTeachers = [];
  for (let i = 0; i < CONFIG.numTeachers; i++) {
    const user = await User.create({
      name: faker.person.fullName(),
      phoneOrEmail: faker.internet.email(),
      role: 'TEACHER',
      institute_id: I_ID
    });
    const t = await Teacher.create({ user_id: user._id, institute_id: I_ID });
    insertedTeachers.push(t);
  }

  // --- Batches ---
  const numBatches = Math.ceil(CONFIG.numStudents / 40); 
  const insertedBatches = [];
  for (let i = 0; i < numBatches; i++) {
    const randomCourse = faker.helpers.arrayElement(insertedCourses);
    const cb = await Batch.create({
      name: `Batch-${randomCourse.name.substring(0,3).toUpperCase()}-${i + 101}`,
      course_id: randomCourse._id,
      teacher_id: faker.helpers.arrayElement(insertedTeachers)._id,
      timing: "10:00 AM - 12:00 PM",
      institute_id: I_ID
    });
    insertedBatches.push(cb);
  }

  console.log(`✅ Generated Institute, ${insertedCourses.length} Courses, ${insertedTeachers.length} Teachers, ${insertedBatches.length} Batches.`);
  console.log('🔄 Generating Students, Fees, Attendance, and Tests...');

  const usersForStudents = [];
  const students = [];
  const fees = [];
  const attendances = [];
  const tests = [];
  const testResults = [];

  // Tests per Batch
  for (const batch of insertedBatches) {
    for (let i = 0; i < CONFIG.testsPerBatch; i++) {
      tests.push({
        _id: new mongoose.Types.ObjectId(),
        name: `Mock Test ${i + 1}`,
        batch_id: batch._id,
        date: faker.date.recent({ days: 30 }),
        total_marks: 100,
        institute_id: I_ID
      });
    }
  }

  // Students and their operational data
  for (let i = 0; i < CONFIG.numStudents; i++) {
    const userId = new mongoose.Types.ObjectId();
    const studentId = new mongoose.Types.ObjectId();
    const batch = faker.helpers.arrayElement(insertedBatches);
    const course = insertedCourses.find(c => c._id.equals(batch.course_id));
    
    // Create User (Student)
    usersForStudents.push({
      _id: userId,
      name: faker.person.fullName(),
      phoneOrEmail: faker.phone.number('+919#########'),
      role: 'STUDENT',
      institute_id: I_ID
    });

    // Create Student
    students.push({
      _id: studentId,
      user_id: userId,
      batch_id: batch._id,
      parent_name: faker.person.fullName(),
      parent_phone: faker.phone.number('+918#########'),
      institute_id: I_ID
    });

    // --- Fees Distribution ---
    // 40% Paid, 40% Partial, 20% Defaulters
    const feeRoll = Math.random();
    let paidAmt, stat;
    if (feeRoll < 0.40) {
      paidAmt = course.base_fee;
      stat = "PAID";
    } else if (feeRoll < 0.80) {
      paidAmt = Math.floor(course.base_fee * faker.number.float({ min: 0.3, max: 0.9 }));
      stat = "PARTIAL";
    } else {
      paidAmt = Math.floor(course.base_fee * faker.number.float({ min: 0, max: 0.15 }));
      stat = "DUE";
    }

    // Since we use pre-save hook, we normally can't use insertMany and get auto-calc. 
    // We will do exact math.
    fees.push({
      student_id: studentId,
      total_amount: course.base_fee,
      paid_amount: paidAmt,
      due_amount: course.base_fee - paidAmt,
      due_date: faker.date.recent({ days: 15 }),
      status: stat,
      institute_id: I_ID
    });

    // --- Attendance ---
    // 85% normal (65-100%), 15% risk (<50%)
    const isAtRisk = Math.random() < 0.15;
    const attProb = isAtRisk ? faker.number.float({ min: 0.2, max: 0.45 }) : faker.number.float({ min: 0.65, max: 1.0 });

    const today = new Date();
    for (let d = 0; d < CONFIG.attendanceDays; d++) {
      const date = new Date(today);
      date.setDate(date.getDate() - d);
      
      if (date.getDay() !== 0) { // No Sunday
        attendances.push({
          student_id: studentId,
          batch_id: batch._id,
          date,
          status: Math.random() < attProb ? 'PRESENT' : 'ABSENT',
          institute_id: I_ID
        });
      }
    }

    // --- Performance / Tests ---
    const sTests = tests.filter(t => t.batch_id.equals(batch._id));
    const perfRoll = Math.random();
    let minM, maxM;
    if (perfRoll < 0.2) { minM = 80; maxM = 100; }
    else if (perfRoll < 0.8) { minM = 50; maxM = 79; }
    else { minM = 10; maxM = 45; }

    for (const test of sTests) {
      testResults.push({
        test_id: test._id,
        student_id: studentId,
        marks: faker.number.int({ min: minM, max: maxM }),
        institute_id: I_ID
      });
    }
  }

  console.log('🚀 Executing Bulk Inserts (Optimized)...');
  await User.insertMany(usersForStudents);
  await Student.insertMany(students);
  await Fee.insertMany(fees);
  await TestModel.insertMany(tests);
  await Result.insertMany(testResults);

  // Insert Attendance in chunks
  const chunkSize = 15000;
  for (let i = 0; i < attendances.length; i += chunkSize) {
    await Attendance.insertMany(attendances.slice(i, i + chunkSize));
  }

  console.log(`🎉 SUCCESS! Fully Simulated Database Seeded in Target Collections.`);
  console.log(`📊 Students: ${students.length} | Tests: ${testResults.length} | Attendance: ${attendances.length}`);
  
  process.exit(0);
}

seedDatabase().catch(err => {
  console.error("Error Seeding:", err);
  process.exit(1);
});
