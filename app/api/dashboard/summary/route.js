import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import { getAuthUser } from "@/lib/auth";
import Student from "@/models/Student";
import Fee from "@/models/Fee";
import Attendance from "@/models/Attendance";

import { requireRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    await dbConnect();
    const authUser = await requireRole(["ADMIN"]);
    
    console.log(`Summary Request: Institute=${authUser.institute_id}`);
    const totalStudents = await Student.countDocuments({ institute_id: authUser.institute_id });
    
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);

    // Fees Collected & Pending
    const feeStats = await Fee.aggregate([
      { $match: { institute_id: authUser.institute_id } },
      {
        $group: {
          _id: null,
          collected: { $sum: "$paid_amount" },
          pending: { 
            $sum: {
              $cond: [ { $lt: ["$due_date", todayStart] }, "$due_amount", 0 ]
            }
          }
        }
      }
    ]);

    const collectedFees = feeStats.length > 0 ? feeStats[0].collected : 0;
    const pendingFees = feeStats.length > 0 ? feeStats[0].pending : 0;

    // Today's Attendance
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const attendanceStats = await Attendance.aggregate([
      { $match: { institute_id: authUser.institute_id, date: { $gte: startOfToday } } },
      // Lookup the student to verify they still exist (prevents counting orphaned records)
      {
        $lookup: {
          from: "students",
          localField: "student_id",
          foreignField: "_id",
          as: "validStudent"
        }
      },
      { $match: { validStudent: { $ne: [] } } },
      // First, get the most recent record for each student today
      { $sort: { updatedAt: -1 } },
      {
        $group: {
          _id: "$student_id",
          status: { $first: "$status" }
        }
      },
      // Then sum the statuses
      {
        $group: {
          _id: null,
          present: { $sum: { $cond: [{ $eq: ["$status", "PRESENT"] }, 1, 0] } },
          absent: { $sum: { $cond: [{ $eq: ["$status", "ABSENT"] }, 1, 0] } }
        }
      }
    ]);

    const presentToday = attendanceStats.length > 0 ? attendanceStats[0].present : 0;
    const absentToday = attendanceStats.length > 0 ? attendanceStats[0].absent : 0;

    return NextResponse.json({
      success: true,
      totalStudents,
      collectedFees,
      pendingFees,
      presentToday,
      absentToday
    });
  } catch (error) {
    console.error("Dashboard Summary Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
