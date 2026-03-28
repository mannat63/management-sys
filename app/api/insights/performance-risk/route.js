import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import { getAuthUser } from "@/lib/auth";
import Result from "@/models/Result";

export async function GET(req) {
  try {
    await dbConnect();
    const authUser = await getAuthUser();
    
    const performanceRisk = await Result.aggregate([
      { $match: { institute_id: authUser.institute_id } },
      {
        $lookup: {
          from: "tests",
          localField: "test_id",
          foreignField: "_id",
          as: "testInfo"
        }
      },
      { $unwind: "$testInfo" },
      {
        $project: {
           student_id: 1,
           percentage: { $multiply: [{ $divide: ["$marks", "$testInfo.total_marks"] }, 100] }
        }
      },
      {
        $group: {
          _id: "$student_id",
          avgMarks: { $avg: "$percentage" }
        }
      },
      { $match: { avgMarks: { $lt: 50 } } },
      { $sort: { avgMarks: 1 } },
      {
        $lookup: {
          from: "students",
          localField: "_id",
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
          studentId: "$_id",
          name: { $ifNull: ["$userInfo.name", "$studentInfo.parent_name"] },
          avgMarks: { $round: ["$avgMarks", 1] }
        }
      }
    ]);

    return NextResponse.json({ success: true, count: performanceRisk.length, data: performanceRisk });
  } catch (error) {
    console.error("Performance Risk Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
