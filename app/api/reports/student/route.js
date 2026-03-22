import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import { getAuthUser } from "@/lib/auth";
import Student from "@/models/Student";
import Attendance from "@/models/Attendance";
import Fee from "@/models/Fee";
import Test from "@/models/Test";
import Result from "@/models/Result";
import Batch from "@/models/Batch";
import Institute from "@/models/Institute";

export async function GET(req) {
  try {
    await dbConnect();
    const authUser = await getAuthUser();
    
    // Only allow students to access this
    if (authUser.role !== "STUDENT") {
        return NextResponse.json({ error: "Forbidden: Students only" }, { status: 403 });
    }
    
    const { searchParams } = new URL(req.url);
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    if (!dateFrom || !dateTo) {
        return NextResponse.json({ error: "dateFrom and dateTo are required" }, { status: 400 });
    }

    const start = new Date(dateFrom);
    const end = new Date(dateTo);
    end.setUTCHours(23, 59, 59, 999);

    const student = await Student.findOne({ user_id: authUser._id })
        .populate("user_id", "name phoneOrEmail")
        .populate("batch_id", "name")
        .lean();

    if (!student) {
        return NextResponse.json({ error: "Student profile not found" }, { status: 404 });
    }

    const sId = student._id;
    const inst = await Institute.findById(student.institute_id).lean();

    // Fetch Aggregated Data for This Student
    const [attendances, fees, tests] = await Promise.all([
      Attendance.find({
        student_id: sId,
        date: { $gte: start, $lte: end }
      }).lean(),
      Fee.find({
        student_id: sId
      }).lean(),
      Test.find({
        batch_id: student.batch_id?._id,
        date: { $gte: start, $lte: end }
      }).lean()
    ]);

    const testIds = tests.map(t => t._id);
    const [myResults, allResults] = await Promise.all([
        Result.find({ test_id: { $in: testIds }, student_id: sId }).lean(),
        Result.find({ test_id: { $in: testIds } }).lean() // to calculate rank
    ]);

    // Calculate Attendance
    const presentCount = attendances.filter(a => a.status === "PRESENT").length;
    const absentCount = attendances.filter(a => a.status === "ABSENT").length;
    const totalDays = presentCount + absentCount;
    const attendancePercentage = totalDays > 0 ? ((presentCount / totalDays) * 100).toFixed(1) : 0;

    // Calculate Fees
    const totalFeeObj = fees.reduce((acc, curr) => {
        acc.total += (curr.total_amount || 0);
        acc.paid += (curr.paid_amount || 0);
        acc.due += (curr.due_amount || 0);
        return acc;
    }, { total: 0, paid: 0, due: 0 });

    // Calculate Tests and Rank
    let marksScored = 0;
    let marksTotal = 0;
    
    const testDetails = myResults.map(r => {
        const testObj = tests.find(t => t._id.toString() === r.test_id?.toString());
        if (testObj) {
            marksScored += (r.marks || 0);
            marksTotal += (testObj.total_marks || 0);
        }
        
        // Calculate specific test rank
        const testOthers = allResults.filter(ar => ar.test_id?.toString() === testObj?._id?.toString());
        testOthers.sort((a, b) => b.marks - a.marks);
        const rank = testOthers.findIndex(a => a.student_id?.toString() === sId.toString()) + 1;

        return {
            test_name: testObj?.name || "Unknown",
            date: testObj?.date,
            marks: r.marks || 0,
            total_marks: testObj?.total_marks || 0,
            percentage: testObj?.total_marks ? ((r.marks / testObj.total_marks) * 100).toFixed(1) : 0,
            rank: rank > 0 ? rank : "N/A"
        };
    });

    const testPercentage = marksTotal > 0 ? ((marksScored / marksTotal) * 100).toFixed(1) : 0;

    return NextResponse.json({
        institute: {
            name: inst?.name || "Institute"
        },
        student: {
            id: sId,
            name: student.user_id?.name || student.parent_name || "Unknown",
            parent_phone: student.parent_phone,
            batch: student.batch_id?.name || "Unknown Course"
        },
        attendance: {
            total_days: totalDays,
            present: presentCount,
            absent: absentCount,
            percentage: parseFloat(attendancePercentage)
        },
        fees: totalFeeObj,
        tests: {
            taken: myResults.length,
            marks_scored: marksScored,
            marks_total: marksTotal,
            percentage: parseFloat(testPercentage),
            details: testDetails
        }
    });
  } catch (error) {
    console.error("Student Report Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
