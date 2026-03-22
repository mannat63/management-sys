import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import { getAuthUser, requireRole } from "@/lib/auth";
import Fee from "@/models/Fee";
import Student from "@/models/Student";
import Institute from "@/models/Institute";
import { sendEventToN8N } from "@/services/n8n";
import Batch from "@/models/Batch";
import User from "@/models/User";

export async function GET(req) {
  try {
    await dbConnect();
    const authUser = await getAuthUser();
    
    const { searchParams } = new URL(req.url);
    const student_id = searchParams.get("student_id");

    const query = { institute_id: authUser.institute_id };
    
    // Strict access control: Teachers cannot see fees.
    if (authUser.role === "TEACHER") {
      return NextResponse.json({ error: "Forbidden: Teachers do not have fee access" }, { status: 403 });
    } else if (authUser.role === "STUDENT") {
      const student = await Student.findOne({ user_id: authUser._id });
      if (!student) return NextResponse.json([], { status: 200 });
      query.student_id = student._id;
    } else {
      // ADMIN
      if (student_id) query.student_id = student_id;
    }

    const fees = await Fee.find(query).populate({
      path: "student_id",
      populate: { path: "user_id", select: "name" }
    });
    return NextResponse.json(fees);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await dbConnect();
    const authUser = await requireRole(["ADMIN"]);

    const body = await req.json();
    const { student_id, total_amount, due_date } = body;

    const fee = await Fee.create({
      student_id,
      total_amount,
      paid_amount: 0,
      due_amount: total_amount,
      due_date,
      status: "DUE",
      institute_id: authUser.institute_id
    });

    // Send fee_due webhook using unified event system
    // We dynamically require models here or at the top. Let's ensure User and Batch are initialized.

    const student = await Student.findById(student_id).populate("batch_id", "name").populate("user_id", "name");
    const inst = await Institute.findById(authUser.institute_id);
    
    if (student && inst) {
      await sendEventToN8N({
        event_type: "fee_reminder",
        timestamp: new Date().toISOString(),
        institute: {
          id: inst._id.toString(),
          name: inst.name
        },
        student: {
          id: student._id.toString(),
          name: student.user_id?.name || student.parent_name || "Student",
          parent_phone: student.parent_phone,
          batch_name: student.batch_id?.name || "Unknown"
        },
        data: {
          due_amount: fee.due_amount,
          due_date: fee.due_date,
          days_overdue: 0
        }
      });
    }

    return NextResponse.json(fee, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
