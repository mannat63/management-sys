import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import { getAuthUser, requireRole } from "@/lib/auth";
import Payment from "@/models/Payment";
import Attendance from "@/models/Attendance";
import Fee from "@/models/Fee";
import Test from "@/models/Test";
import Result from "@/models/Result";

export async function GET(req) {
  try {
    await dbConnect();
    const authUser = await requireRole(["ADMIN"]);
    const iid = authUser.institute_id;
    
    // Default timeframe: last 30 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 30);
    
    // Seed charts with a clean line of zeros for the last 30 days so UI never breaks
    const revMap = {};
    const attMap = {};
    for (let i = 0; i <= 30; i++) {
       const d = new Date();
       d.setDate(d.getDate() - i);
       const dStr = d.toISOString().split('T')[0];
       revMap[dStr] = 0;
       attMap[dStr] = { present: 0, total: 0 };
    }
    
    // 1. Revenue Data
    const payments = await Payment.find({
      institute_id: iid,
      createdAt: { $gte: startDate, $lte: endDate }
    }).lean();
    
    payments.forEach(p => {
       const dStr = new Date(p.createdAt).toISOString().split('T')[0];
       if (revMap[dStr] !== undefined) {
         revMap[dStr] += p.amount || 0;
       }
    });
    
    // Build array sorted by date
    const revenueData = Object.keys(revMap).sort().map(d => ({
       date: new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
       amount: revMap[d]
    }));

    // 2. Attendance Data
    const attendances = await Attendance.find({
      institute_id: iid,
      date: { $gte: startDate, $lte: endDate }
    }).lean();
    
    attendances.forEach(a => {
       const dStr = new Date(a.date).toISOString().split('T')[0];
       if (attMap[dStr]) {
          attMap[dStr].total += 1;
          if (a.status === "PRESENT") attMap[dStr].present += 1;
       }
    });
    
    const attendanceData = Object.keys(attMap).sort().map(d => {
       const stats = attMap[d];
       const presentPct = stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0;
       return {
         date: new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
         presentPct
       };
    });

    // 3. Fee Status Data
    const fees = await Fee.find({ institute_id: iid }).lean();
    let paidSum = 0;
    let pendingSum = 0;
    fees.forEach(f => {
       paidSum += (f.paid_amount || 0);
       pendingSum += Math.max(0, (f.total_amount || 0) - (f.paid_amount || 0));
    });
    const feeData = [
       { name: "Collected", value: paidSum, fill: "#10b981" }, // Emerald 500
       { name: "Pending", value: pendingSum, fill: "#f43f5e" } // Rose 500
    ];

    // 4. Test Performance Data
    const tests = await Test.find({ institute_id: iid }).sort({ date: -1 }).limit(5).lean();
    const testData = [];
    
    // Go in chronological order for graph (left to right)
    for (const test of tests.reverse()) {
       const results = await Result.find({ test_id: test._id }).lean();
       let avg = 0;
       if (results.length > 0 && test.total_marks > 0) {
          const sum = results.reduce((acc, r) => acc + (r.marks || 0), 0);
          avg = Math.round((sum / (results.length * test.total_marks)) * 100);
       }
       testData.push({
          name: test.name.substring(0, 10) + (test.name.length > 10 ? '...' : ''),
          avgScore: avg
       });
    }

    return NextResponse.json({
       revenue: revenueData,
       attendance: attendanceData,
       feesObj: feeData,
       tests: testData
    });
    
  } catch (error) {
    console.error("Graphs API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
