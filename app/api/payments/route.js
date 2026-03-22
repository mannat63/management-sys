import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import { getAuthUser, requireRole } from "@/lib/auth";
import Payment from "@/models/Payment";

export async function POST(req) {
  try {
    await dbConnect();
    const authUser = await requireRole(["ADMIN"]); // manual entry by admin

    const body = await req.json();
    const { student_id, fee_id, amount, method, reference_note } = body;

    const payment = await Payment.create({
      student_id,
      fee_id,
      amount,
      method,
      reference_note,
      status: "PENDING",
      institute_id: authUser.institute_id
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
