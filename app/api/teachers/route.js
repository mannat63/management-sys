import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import { getAuthUser, requireRole } from "@/lib/auth";
import Teacher from "@/models/Teacher";
import User from "@/models/User";

export async function GET(req) {
  try {
    await dbConnect();
    const authUser = await getAuthUser();
    
    if (!["ADMIN"].includes(authUser.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const teachers = await Teacher.find({ institute_id: authUser.institute_id })
      .populate("user_id", "name phoneOrEmail");
    return NextResponse.json(teachers);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await dbConnect();
    const authUser = await requireRole(["ADMIN"]);

    const body = await req.json();
    const { name, phoneOrEmail } = body;

    const user = await User.create({
      name,
      phoneOrEmail,
      role: "TEACHER",
      institute_id: authUser.institute_id
    });

    const teacher = await Teacher.create({
      user_id: user._id,
      institute_id: authUser.institute_id
    });

    return NextResponse.json(teacher, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
