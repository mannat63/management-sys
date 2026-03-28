import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import { requireRole } from "@/lib/auth";
import Student from "@/models/Student";
import Institute from "@/models/Institute";
import { sendEventToN8N } from "@/services/n8n";

export async function POST(req) {
  try {
    await dbConnect();
    const authUser = await requireRole(["ADMIN", "TEACHER"]);
    
    const body = await req.json();
    const { student_id, risk_type, risk_value } = body;

    if (!student_id || !risk_type) {
      return NextResponse.json({ error: "student_id and risk_type are required" }, { status: 400 });
    }

    const student = await Student.findById(student_id)
      .populate("user_id", "name")
      .populate("batch_id", "name")
      .lean();
      
    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const inst = await Institute.findById(authUser.institute_id);

    // Send generic risk event to N8N
    await sendEventToN8N({
      event_type: "student_risk_alert",
      timestamp: new Date().toISOString(),
      institute: {
        id: inst._id.toString(),
        name: inst.name
      },
      student: {
        id: student._id.toString(),
        name: student.user_id?.name || student.parent_name,
        parent_phone: student.parent_phone,
        batch_name: student.batch_id?.name || "Unknown"
      },
      risk: {
        type: risk_type, // "fees", "attendance", "performance"
        value: risk_value
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: `Risk notification (${risk_type}) sent to ${student.user_id?.name || 'parent'}` 
    });

  } catch (error) {
    console.error("Risk Notify Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
