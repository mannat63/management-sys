import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import { requireRole } from "@/lib/auth";
import Payment from "@/models/Payment";
import Fee from "@/models/Fee";
import Student from "@/models/Student";
import { sendEventToN8N } from "@/services/n8n";

export async function PUT(req, { params }) {
  try {
    await dbConnect();
    const authUser = await requireRole(["ADMIN"]);

    const { id } = await params;

    const payment = await Payment.findOneAndUpdate(
      { _id: id, institute_id: authUser.institute_id, status: { $ne: "CONFIRMED" } },
      { $set: { status: "CONFIRMED" } },
      { new: true }
    );
    if (!payment) {
      const existing = await Payment.findOne({ _id: id, institute_id: authUser.institute_id });
      if (!existing) return NextResponse.json({ error: "Payment not found" }, { status: 404 });
      if (existing.status === "CONFIRMED") return NextResponse.json({ error: "Already confirmed" }, { status: 400 });
    }

    const fee = await Fee.findOne({ _id: payment.fee_id, institute_id: authUser.institute_id });
    if (!fee) return NextResponse.json({ error: "Fee not found" }, { status: 404 });

    fee.paid_amount = (Number(fee.paid_amount) || 0) + Number(payment.amount);
    await fee.save(); // pre-save hook handles due_amount & status

    // Trigger confirmation webhook
    const student = await Student.findById(payment.student_id);
    if (student) {
      await sendEventToN8N({
        event_type: "payment_confirmation",
        student: {
          name: student.name || "Student",
          parent_phone: student.parent_phone,
        },
        data: {
          amount: payment.amount,
        }
      });
    }

    return NextResponse.json({ message: "Payment confirmed", payment, fee });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
