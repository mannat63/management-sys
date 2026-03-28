import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import { requireRole } from "@/lib/auth";
import Result from "@/models/Result";
import "@/models/Test"; // Ensure model is registered
import mongoose from "mongoose";

export async function GET(req, { params }) {
  try {
    await dbConnect();
    await requireRole(["ADMIN", "TEACHER"]);
    
    const { id: studentId } = params;

    const results = await Result.find({ 
      student_id: new mongoose.Types.ObjectId(studentId) 
    })
      .populate({
        path: "test_id",
        select: "name date total_marks"
      })
      .lean();

    // Sort manually if population path sort fails (dates are on test_id)
    results.sort((a, b) => {
      const dateA = a.test_id?.date ? new Date(a.test_id.date) : 0;
      const dateB = b.test_id?.date ? new Date(b.test_id.date) : 0;
      return dateB - dateA;
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error("Student Performance API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
