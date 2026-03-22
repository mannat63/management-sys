import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import { requireRole } from "@/lib/auth";
import mongoose from "mongoose";

import Result from "@/models/Result";
import Payment from "@/models/Payment";
import Fee from "@/models/Fee";
import Attendance from "@/models/Attendance";
import Batch from "@/models/Batch";
import Student from "@/models/Student";
import User from "@/models/User";

export async function GET(req) {
  try {
    await dbConnect();
    // Only Admin gets access to chatbot analytics
    const authUser = await requireRole(["ADMIN"]);

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q");

    if (!q) {
      return NextResponse.json({ answer: "Please provide a valid question." });
    }

    const instId = new mongoose.Types.ObjectId(authUser.institute_id);

    switch (q) {
      case "performance": {
        // Find batch with highest avg marks
        const results = await Result.aggregate([
          { $match: { institute_id: instId } },
          {
            $lookup: {
              from: "students",
              localField: "student_id",
              foreignField: "_id",
              as: "student"
            }
          },
          { $unwind: "$student" },
          {
            $group: {
              _id: "$student.batch_id",
              avgScore: { $avg: "$marks_obtained" }
            }
          },
          { $sort: { avgScore: -1 } },
          { $limit: 1 },
          {
            $lookup: {
              from: "batches",
              localField: "_id",
              foreignField: "_id",
              as: "batch"
            }
          },
          { $unwind: "$batch" }
        ]);

        if (results.length > 0) {
          const avgScore = results[0].avgScore || 0;
          return NextResponse.json({
            answer: `The best performing batch is **${results[0].batch.name}** with an average score of ${avgScore.toFixed(1)} marks.`
          });
        }
        return NextResponse.json({ answer: "I don't have enough test result data to evaluate performance right now." });
      }

      case "revenue": {
        // Find batch generating the highest confirmed revenue
        const revenues = await Payment.aggregate([
          { $match: { institute_id: instId, status: "CONFIRMED" } },
          {
            $lookup: {
              from: "students",
              localField: "student_id",
              foreignField: "_id",
              as: "student"
            }
          },
          { $unwind: "$student" },
          {
            $group: {
              _id: "$student.batch_id",
              totalCollected: { $sum: "$amount" }
            }
          },
          { $sort: { totalCollected: -1 } },
          { $limit: 1 },
          {
            $lookup: {
              from: "batches",
              localField: "_id",
              foreignField: "_id",
              as: "batch"
            }
          },
          { $unwind: "$batch" }
        ]);

        if (revenues.length > 0) {
          return NextResponse.json({
            answer: `The highest paying batch is **${revenues[0].batch.name}**, which has generated **₹${revenues[0].totalCollected.toLocaleString()}** in confirmed revenue.`
          });
        }
        return NextResponse.json({ answer: "No confirmed payments found to calculate batch revenue." });
      }

      case "defaulters": {
        // Fetch top 5 unpaid students
        const defaulters = await Fee.aggregate([
          { $match: { institute_id: instId, status: { $ne: "PAID" } } },
          {
            $lookup: {
              from: "students",
              localField: "student_id",
              foreignField: "_id",
              as: "student"
            }
          },
          { $unwind: "$student" },
          {
            $lookup: {
              from: "users",
              localField: "student.user_id",
              foreignField: "_id",
              as: "user"
            }
          },
          { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
          { $sort: { due_amount: -1 } },
          { $limit: 5 }
        ]);

        if (defaulters.length > 0) {
          const lines = defaulters.map(d => `- **${d.user?.name || d.student.parent_name}**: Owes ₹${d.due_amount.toLocaleString()}`).join("\n");
          return NextResponse.json({
            answer: `Here are the top students with unpaid fees:\n${lines}\n\nYou can send them automatic WhatsApp reminders from the Fees dashboard!`
          });
        }
        return NextResponse.json({ answer: "Great news! Everyone has paid their fees. No defaulters found." });
      }

      case "attendance": {
        // Batch with most absentees overall
        const absentees = await Attendance.aggregate([
          { $match: { institute_id: instId, status: "ABSENT" } },
          {
            $group: {
              _id: "$batch_id",
              absentCount: { $sum: 1 }
            }
          },
          { $sort: { absentCount: -1 } },
          { $limit: 1 },
          {
            $lookup: {
              from: "batches",
              localField: "_id",
              foreignField: "_id",
              as: "batch"
            }
          },
          { $unwind: "$batch" }
        ]);

        if (absentees.length > 0) {
          return NextResponse.json({
            answer: `**${absentees[0].batch.name}** currently has the most absentee records (Total: ${absentees[0].absentCount} missed sessions).`
          });
        }
        return NextResponse.json({ answer: "All students seem to be perfectly present. No absent records found!" });
      }

      default:
        return NextResponse.json({ answer: "I'm not exactly sure how to answer that yet. Ask me one of the predefined questions!" });
    }
  } catch (error) {
    console.error("Chatbot API Error:", error);
    return NextResponse.json({ answer: "Oops! I encountered an error calculating that data." }, { status: 500 });
  }
}
