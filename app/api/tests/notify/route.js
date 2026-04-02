import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import { requireRole } from "@/lib/auth";
import Result from "@/models/Result";
import Test from "@/models/Test";
import Student from "@/models/Student";
import Institute from "@/models/Institute";
import Notification from "@/models/Notification";
import { sendEventToN8N } from "@/services/n8n";

export async function POST(req) {
  try {
    await dbConnect();
    await requireRole(["ADMIN", "TEACHER"]);

    const body = await req.json();
    const { test_id } = body;

    if (!test_id) {
      return NextResponse.json({ error: "test_id is required" }, { status: 400 });
    }

    // Fetch the test
    const test = await Test.findById(test_id).populate("batch_id", "name");
    if (!test) {
      return NextResponse.json({ error: "Test not found" }, { status: 404 });
    }
    const inst = await Institute.findById(test.institute_id);

    // Fetch all results for this test
    const results = await Result.find({ test_id })
      .populate({
        path: "student_id",
        populate: { path: "user_id", select: "name phoneOrEmail" }
      });

    if (!results || results.length === 0) {
      return NextResponse.json({ error: "No results found for this test. Please enter marks first." }, { status: 400 });
    }

    let sentCount = 0;
    const errors = [];
    const testDate = new Date(test.date).toLocaleDateString("en-GB");

    for (const result of results) {
      const student = result.student_id;
      const studentName = student?.user_id?.name || student?.parent_name || "Student";
      const parentPhone = student?.parent_phone;

      if (!parentPhone || parentPhone === "—") {
        errors.push(`Skipped ${studentName}: No valid parent phone number.`);
        continue;
      }

      try {
        await sendEventToN8N({
          event_type: "test_result",
          timestamp: new Date().toISOString(),
          institute: {
            id: inst?._id?.toString() || "",
            name: inst?.name || "Institute"
          },
          student: {
            id: student._id.toString(),
            name: studentName,
            parent_phone: parentPhone,
            batch_name: test.batch_id?.name || "Unknown"
          },
          data: {
            test_name: test.name,
            marks: result.marks,
            total_marks: test.total_marks
          }
        });

        sentCount++;
      } catch (err) {
        errors.push(`Failed to notify ${studentName}: ${err.message}`);
      }
    }

    if (sentCount > 0) {
      await Notification.create({
        institute_id: inst._id,
        type: "TEST_RESULT_ALERT",
        recipient_name: "Class Broadcast",
        recipient_phone: `Batch: ${test.batch_id?.name || "All"}`,
        message: `Official test marks for '${test.name}' out of ${test.total_marks} have been successfully broadcasted directly to ${sentCount} students/parents.`,
        status: "SENT"
      });
    }

    return NextResponse.json({
      success: true,
      sent: sentCount,
      total: results.length,
      skipped: errors.length,
      errors,
      message: `Successfully sent ${sentCount} score notification${sentCount !== 1 ? "s" : ""} for "${test.name}".`
    });

  } catch (error) {
    console.error("Test Notify Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
