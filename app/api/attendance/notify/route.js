import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import { requireRole } from "@/lib/auth";
import Attendance from "@/models/Attendance";
import Student from "@/models/Student";
import User from "@/models/User";
import Batch from "@/models/Batch";
import Institute from "@/models/Institute";
import { sendEventToN8N } from "@/services/n8n";

export async function POST(req) {
  try {
    await dbConnect();
    const authUser = await requireRole(["ADMIN"]);

    const body = await req.json();
    const { batch_id, date } = body;

    if (!batch_id || !date) {
      return NextResponse.json({ error: "batch_id and date are required" }, { status: 400 });
    }

    // Get batch name
    const batch = await Batch.findById(batch_id);
    if (!batch) {
      return NextResponse.json({ error: "Batch not found" }, { status: 404 });
    }
    const inst = await Institute.findById(authUser.institute_id);

    // Fetch attendance records for this batch and date
    const dateStart = new Date(date);
    const dateEnd = new Date(date);
    dateEnd.setDate(dateEnd.getDate() + 1);

    const records = await Attendance.find({
      batch_id,
      date: { $gte: dateStart, $lt: dateEnd }
    }).populate({
      path: "student_id",
      populate: { path: "user_id", select: "name" }
    });

    if (!records || records.length === 0) {
      return NextResponse.json({ error: "No attendance records found for this date. Please save attendance first." }, { status: 400 });
    }

    let sentCount = 0;
    const errors = [];
    const dateFormatted = new Date(date).toLocaleDateString("en-GB");

    for (const rec of records) {
      const student = rec.student_id;
      const studentName = student?.user_id?.name || student?.parent_name || "Student";
      const parentPhone = student?.parent_phone;

      if (!parentPhone || parentPhone === "—") {
        errors.push(`Skipped ${studentName}: No valid parent phone.`);
        continue;
      }

      try {
        if (rec.status === "ABSENT") {
          await sendEventToN8N({
            event_type: "attendance_alert",
            timestamp: new Date().toISOString(),
            institute: {
              id: inst._id.toString(),
              name: inst.name
            },
            student: {
              id: student._id.toString(),
              name: studentName,
              parent_phone: parentPhone,
              batch_name: batch.name
            },
            data: {
              date: date,
              status: "ABSENT"
            }
          });
          sentCount++;
        }
      } catch (err) {
        errors.push(`Failed to notify ${studentName}: ${err.message}`);
      }
    }

    const presentCount = records.filter(r => r.status === "PRESENT").length;
    const absentCount = records.filter(r => r.status === "ABSENT").length;

    return NextResponse.json({
      success: true,
      sent: sentCount,
      total: records.length,
      present: presentCount,
      absent: absentCount,
      skipped: errors.length,
      errors,
      message: `Sent ${sentCount} attendance notification${sentCount !== 1 ? "s" : ""} for ${batch.name} (${dateFormatted}). Present: ${presentCount}, Absent: ${absentCount}.`
    });

  } catch (error) {
    console.error("Attendance Notify Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
