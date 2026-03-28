import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import { requireRole } from "@/lib/auth";
import Attendance from "@/models/Attendance";
import Teacher from "@/models/Teacher";
import Batch from "@/models/Batch";

export const dynamic = "force-dynamic";

/**
 * POST /api/attendance/mark
 * Body: { records: [{ student_id, batch_id, date, status }] }
 *   OR: { student_id, batch_id, date, status }  (single record, backward compat)
 *
 * Uses bulkWrite with upsert for O(1) DB round-trips regardless of class size.
 */
export async function POST(req) {
  try {
    await dbConnect();
    const authUser = await requireRole(["ADMIN", "TEACHER"]);

    const body = await req.json();

    // Support both single record and batch array
    const records = Array.isArray(body.records) ? body.records : [body];

    // Security: teacher can only mark for their own batches
    if (authUser.role === "TEACHER") {
      const teacher = await Teacher.findOne(
        { user_id: authUser._id },
        { _id: 1 }
      ).lean();
      if (!teacher) throw new Error("Teacher profile not found");

      const batchIds = [...new Set(records.map((r) => r.batch_id?.toString()))];
      const validBatches = await Batch.find(
        {
          _id: { $in: batchIds },
          teacher_id: teacher._id,
          institute_id: authUser.institute_id,
        },
        { _id: 1 }
      ).lean();

      const validIds = new Set(validBatches.map((b) => b._id.toString()));
      const forbidden = batchIds.find((id) => !validIds.has(id));
      if (forbidden) {
        return NextResponse.json(
          { error: "Forbidden: Not your batch" },
          { status: 403 }
        );
      }
    }

    // Build bulkWrite operations — upsert each student attendance record
    const ops = records.map(({ student_id, batch_id, date, status }) => {
      const targetDate = new Date(date);
      targetDate.setUTCHours(0, 0, 0, 0);

      return {
        updateOne: {
          filter: {
            student_id,
            batch_id,
            date: targetDate,
            institute_id: authUser.institute_id,
          },
          update: {
            $set: { status, marked_by: authUser._id },
            $setOnInsert: { createdAt: new Date() },
          },
          upsert: true,
        },
      };
    });

    const result = await Attendance.bulkWrite(ops, { ordered: false });

    return NextResponse.json(
      {
        ok: true,
        upserted: result.upsertedCount,
        modified: result.modifiedCount,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Attendance mark error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
