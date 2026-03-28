import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import dbConnect from "@/lib/db/mongodb";

export async function GET() {
  try {
    await dbConnect();
    const user = await getAuthUser();
    return NextResponse.json({ status: "authorized", user: user.name });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
