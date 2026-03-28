import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import { getAuthUser } from "@/lib/auth";
import Fee from "@/models/Fee";

export async function GET(req) {
  try {
    await dbConnect();
    const authUser = await getAuthUser();
    
    const now = new Date();
    // Fee Defaulters: Any unpaid fees that are actually overdue
    const defaulters = await Fee.aggregate([
      { $match: { institute_id: authUser.institute_id, due_amount: { $gt: 0 }, due_date: { $lt: now } } },
      { $sort: { due_amount: -1 } },
      {
        $lookup: {
          from: "students",
          localField: "student_id",
          foreignField: "_id",
          as: "studentInfo"
        }
      },
      { $unwind: "$studentInfo" },
      {
        $lookup: {
          from: "users",
          localField: "studentInfo.user_id",
          foreignField: "_id",
          as: "userInfo"
        }
      },
      { $unwind: { path: "$userInfo", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          studentId: "$student_id",
          name: { $ifNull: ["$userInfo.name", "$studentInfo.parent_name"] },
          pendingAmount: "$due_amount",
          totalAmount: "$total_amount",
          dueDate: "$due_date"
        }
      }
    ]);

    return NextResponse.json({ success: true, count: defaulters.length, data: defaulters });
  } catch (error) {
    console.error("Fee Defaulters Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
