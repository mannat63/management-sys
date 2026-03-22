import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import { getAuthUser, requireRole } from "@/lib/auth";
import InstitutePaymentDetail from "@/models/InstitutePaymentDetail";

export async function GET(req) {
  try {
    await dbConnect();
    const authUser = await getAuthUser();

    // Even students should be able to see payment details to make payments
    const details = await InstitutePaymentDetail.findOne({ institute_id: authUser.institute_id });
    return NextResponse.json(details || {});
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await dbConnect();
    const authUser = await requireRole(["ADMIN"]);

    const body = await req.json();
    const { bank_name, account_number, ifsc_code, upi_id, qr_image_url } = body;

    const details = await InstitutePaymentDetail.findOneAndUpdate(
      { institute_id: authUser.institute_id },
      { bank_name, account_number, ifsc_code, upi_id, qr_image_url },
      { upsert: true, new: true }
    );

    return NextResponse.json(details, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
