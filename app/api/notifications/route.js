import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import { requireRole } from "@/lib/auth";
import Notification from "@/models/Notification";

export async function GET(req) {
  try {
    await dbConnect();
    const authUser = await requireRole(["ADMIN", "TEACHER"]);
    
    // Notifications sorted by newest first
    const notifications = await Notification.find({ institute_id: authUser.institute_id })
                                            .sort({ created_at: -1 })
                                            .limit(100)
                                            .populate("student_id", "user_id")
                                            .lean();
                                            
    // Optionally format dates here
    return NextResponse.json(notifications);
  } catch (error) {
    console.error("Fetch Notifications Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
