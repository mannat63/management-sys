import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import { getAuthUser } from "@/lib/auth";
import Student from "@/models/Student";
import Teacher from "@/models/Teacher";
import Batch from "@/models/Batch";
import Fee from "@/models/Fee";
import Attendance from "@/models/Attendance";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await dbConnect();
    const authUser = await getAuthUser();
    const iid = authUser.institute_id;

    if (authUser.role === "ADMIN") {
      // IST midnight for today's attendance lookup
      const now = new Date();
      const istOffset = 5.5 * 60 * 60 * 1000;
      const todayUTC = new Date(now.getTime() + istOffset);
      todayUTC.setUTCHours(0, 0, 0, 0);

      // Run all aggregations in parallel — no in-memory reduce on whole collection
      const [
        totalStudents,
        feeAgg,
        attendanceAgg,
      ] = await Promise.all([
        Student.countDocuments({ institute_id: iid }),

        // Single aggregation for all fee metrics
        Fee.aggregate([
          { $match: { institute_id: iid } },
          {
            $group: {
              _id: null,
              totalFees: { $sum: "$total_amount" },
              collectedFees: { $sum: "$paid_amount" },
              pendingFees: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        { $ne: ["$status", "PAID"] },
                        { $lte: ["$due_date", now] },
                      ],
                    },
                    "$due_amount",
                    0,
                  ],
                },
              },
            },
          },
        ]),

        // Single aggregation for today's attendance — count present/absent
        Attendance.aggregate([
          { $match: { institute_id: iid, date: todayUTC } },
          {
            $group: {
              _id: "$student_id",
              // take latest record if duplicates exist
              status: { $last: "$status" },
            },
          },
          {
            $group: {
              _id: null,
              presentToday: {
                $sum: { $cond: [{ $eq: ["$status", "PRESENT"] }, 1, 0] },
              },
              absentToday: {
                $sum: { $cond: [{ $eq: ["$status", "ABSENT"] }, 1, 0] },
              },
            },
          },
        ]),
      ]);

      const fees = feeAgg[0] || { totalFees: 0, collectedFees: 0, pendingFees: 0 };
      const att = attendanceAgg[0] || { presentToday: 0, absentToday: 0 };

      return NextResponse.json({
        totalStudents,
        totalFees: fees.totalFees,
        collectedFees: fees.collectedFees,
        pendingFees: fees.pendingFees,
        presentToday: att.presentToday,
        absentToday: att.absentToday,
        role: "ADMIN",
      });
    }

    if (authUser.role === "TEACHER") {
      const teacher = await Teacher.findOne(
        { user_id: authUser._id },
        { _id: 1 }
      ).lean();
      if (!teacher)
        return NextResponse.json({ batchesCount: 0, studentCount: 0, role: "TEACHER" });

      const [batches, studentCount] = await Promise.all([
        Batch.find({ teacher_id: teacher._id }, { _id: 1 }).lean(),
        Student.countDocuments({ batch_id: { $in: [] } }), // filled below
      ]);

      const batchIds = batches.map((b) => b._id);
      const sc = await Student.countDocuments({ batch_id: { $in: batchIds } });

      return NextResponse.json({
        batchesCount: batches.length,
        studentCount: sc,
        role: "TEACHER",
      });
    }

    if (authUser.role === "STUDENT") {
      const student = await Student.findOne(
        { user_id: authUser._id },
        { _id: 1 }
      ).lean();
      if (!student)
        return NextResponse.json({
          pendingFees: 0,
          presentCount: 0,
          totalAttendanceDays: 0,
          role: "STUDENT",
        });

      const [feeAgg, attAgg] = await Promise.all([
        Fee.aggregate([
          { $match: { student_id: student._id } },
          { $group: { _id: null, pending: { $sum: "$due_amount" } } },
        ]),
        Attendance.aggregate([
          { $match: { student_id: student._id } },
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              present: {
                $sum: { $cond: [{ $eq: ["$status", "PRESENT"] }, 1, 0] },
              },
            },
          },
        ]),
      ]);

      return NextResponse.json({
        pendingFees: feeAgg[0]?.pending || 0,
        presentCount: attAgg[0]?.present || 0,
        totalAttendanceDays: attAgg[0]?.total || 0,
        role: "STUDENT",
      });
    }

    return NextResponse.json({ role: "UNKNOWN" });
  } catch (error) {
    console.error("Dashboard API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
