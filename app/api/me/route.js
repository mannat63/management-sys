import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import dbConnect from "@/lib/db/mongodb";

export async function GET() {
  try {
    await dbConnect();
    const user = await getAuthUser();
    return NextResponse.json({
      role: user.role,
      name: user.name,
      email: user.phoneOrEmail
    });
  } catch (error) {
    return NextResponse.json({ role: "STUDENT" }, { status: 401 });
  }
}
