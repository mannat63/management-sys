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
           totalScore: { 
             $add: [
               { $ifNull: ["$marks", 0] },
               { $sum: "$subject_marks.marks" }
             ]
           },
           totalMax: {
             $cond: [
               { $gt: [{ $size: { $ifNull: ["$testInfo.subjects", []] } }, 0] },
               { $sum: "$testInfo.subjects.max_marks" },
               { $ifNull: ["$testInfo.total_marks", 0] }
             ]
           }
        }
      },
      {
        $project: {
           student_id: 1,
           percentage: { 
             $cond: [
               { $gt: ["$totalMax", 0] },
               { $multiply: [{ $divide: ["$totalScore", "$totalMax"] }, 100] },
               0
             ]
           }
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
