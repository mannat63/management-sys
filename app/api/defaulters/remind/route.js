import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import { requireRole } from "@/lib/auth";
import Fee from "@/models/Fee";
import Student from "@/models/Student";
import User from "@/models/User";

import Institute from "@/models/Institute";
import Batch from "@/models/Batch";
import { sendEventToN8N } from "@/services/n8n";

export async function POST(req) {
  try {
    await dbConnect();
    const authUser = await requireRole(["ADMIN"]);

    const body = await req.json();
    const { fees } = body; // Array of fee objects: { _id, student_id, name, parent_phone, due_amount, days_overdue }

    if (!Array.isArray(fees) || fees.length === 0) {
      return NextResponse.json({ error: "No fees provided for reminders" }, { status: 400 });
    }

    let sentCount = 0;
    const errors = [];
    const inst = await Institute.findById(authUser.institute_id);

    for (const fee of fees) {
      if (!fee.parent_phone || fee.parent_phone === "—") {
        errors.push(`Skipped ${fee.name}: No valid phone number.`);
        continue;
      }
      
      try {
        const student = await Student.findById(fee.student_id).populate("batch_id", "name").lean();
        
        await sendEventToN8N({
          event_type: "fee_reminder",
          timestamp: new Date().toISOString(),
          institute: {
            id: inst._id.toString(),
            name: inst.name
          },
          student: {
            id: fee.student_id,
            name: fee.name,
            parent_phone: fee.parent_phone,
            batch_name: student?.batch_id?.name || "Unknown"
          },
          data: {
            due_amount: fee.due_amount,
            due_date: new Date(new Date().setDate(new Date().getDate() - fee.days_overdue)).toLocaleDateString("en-CA"), // fallback approximate date
            days_overdue: fee.days_overdue
          }
        });
        
        sentCount++;
      } catch (err) {
        errors.push(`Failed to send to ${fee.name}: ${err.message}`);
      }
    }

    return NextResponse.json({ 
      success: true, 
      sent: sentCount, 
      skipped: errors.length,
      errors 
    });

  } catch (error) {
    console.error("Defaulters Remind Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
