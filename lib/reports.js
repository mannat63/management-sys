import dbConnect from "@/lib/db/mongodb";
import Student from "@/models/Student";
import Attendance from "@/models/Attendance";
import Fee from "@/models/Fee";
import Test from "@/models/Test";
import Result from "@/models/Result";

export async function fetchAdminReportData({ institute_id, dateFrom, dateTo, batchId, studentId }) {
    await dbConnect();

    const start = new Date(dateFrom);
    const end = new Date(dateTo);
    end.setUTCHours(23, 59, 59, 999);

    let studentQuery = { institute_id };
    if (batchId) studentQuery.batch_id = batchId;
    if (studentId) studentQuery._id = studentId;

    const students = await Student.find(studentQuery)
      .populate("user_id", "name phoneOrEmail")
      .populate("batch_id", "name")
      .lean();

    if (students.length === 0) return { overview: null, students: [] };

    const studentIds = students.map(s => s._id);

    const [attendances, fees, tests] = await Promise.all([
      Attendance.find({ student_id: { $in: studentIds }, date: { $gte: start, $lte: end } }).lean(),
      Fee.find({ student_id: { $in: studentIds } }).lean(),
      Test.find({ institute_id, date: { $gte: start, $lte: end }, ...(batchId ? { batch_id: batchId } : {}) }).lean()
    ]);

    const testIds = tests.map(t => t._id);
    const results = await Result.find({ test_id: { $in: testIds }, student_id: { $in: studentIds } }).lean();

    const reportData = students.map(student => {
        const sId = student._id.toString();
        
        const studentAtt = attendances.filter(a => a.student_id?.toString() === sId);
        const presentCount = studentAtt.filter(a => a.status === "PRESENT").length;
        const absentCount = studentAtt.filter(a => a.status === "ABSENT").length;
        const totalDays = presentCount + absentCount;
        const attendancePercentage = totalDays > 0 ? ((presentCount / totalDays) * 100).toFixed(1) : 0;

        const studentFees = fees.filter(f => f.student_id?.toString() === sId);
        const totalFeeObj = studentFees.reduce((acc, curr) => {
            acc.total += (curr.total_amount || 0);
            acc.paid += (curr.paid_amount || 0);
            acc.due += (curr.due_amount || 0);
            return acc;
        }, { total: 0, paid: 0, due: 0 });

        let marksScored = 0;
        let marksTotal = 0;
        const studentResults = results.filter(r => r.student_id?.toString() === sId);
        
        const testDetails = studentResults.map(r => {
            const testObj = tests.find(t => t._id.toString() === r.test_id?.toString());
            if (testObj) {
                marksScored += (r.marks || 0);
                marksTotal += (testObj.total_marks || 0);
            }
            return {
                test_name: testObj?.name || "Unknown",
                date: testObj?.date,
                marks: r.marks || 0,
                total_marks: testObj?.total_marks || 0
            };
        });

        const testPercentage = marksTotal > 0 ? ((marksScored / marksTotal) * 100).toFixed(1) : 0;

        return {
            student: {
                id: sId,
                name: student.user_id?.name || student.parent_name || "Unknown",
                parent_phone: student.parent_phone,
                batch: student.batch_id?.name || "Unknown Course"
            },
            attendance: { total_days: totalDays, present: presentCount, absent: absentCount, percentage: parseFloat(attendancePercentage) },
            fees: totalFeeObj,
            tests: { taken: studentResults.length, marks_scored: marksScored, marks_total: marksTotal, percentage: parseFloat(testPercentage), details: testDetails }
        };
    });

    reportData.sort((a, b) => b.tests.percentage - a.tests.percentage);
    reportData.forEach((sd, index) => { sd.tests.rank = sd.tests.taken > 0 ? index + 1 : "N/A"; });
    reportData.sort((a, b) => a.student.name.localeCompare(b.student.name));

    const overview = {
        total_students: reportData.length,
        total_revenue_collected: reportData.reduce((sum, s) => sum + s.fees.paid, 0),
        pending_fees: reportData.reduce((sum, s) => sum + s.fees.due, 0),
        avg_attendance: reportData.length > 0 ? (reportData.reduce((sum, s) => sum + s.attendance.percentage, 0) / reportData.filter(s => s.attendance.total_days > 0).length || 1).toFixed(1) : 0,
        tests_conducted: tests.length
    };

    return { overview, students: reportData };
}
