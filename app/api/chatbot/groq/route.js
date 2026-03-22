import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import { requireRole } from "@/lib/auth";
import mongoose from "mongoose";
import Groq from "groq-sdk";

import Payment from "@/models/Payment";
import Student from "@/models/Student";
import Batch from "@/models/Batch";
import Fee from "@/models/Fee";
import Attendance from "@/models/Attendance";
import Result from "@/models/Result";
import Test from "@/models/Test";
import User from "@/models/User";
import Teacher from "@/models/Teacher";
import Course from "@/models/Course";
import Institute from "@/models/Institute";
export async function POST(req) {
  try {
    await dbConnect();
    const authUser = await requireRole(["ADMIN"]);

    const body = await req.json();
    const { message, history } = body;

    if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY.trim() === "") {
      return NextResponse.json({ 
        answer: "⚠️ **Groq API Key Missing!** Please paste your `GROQ_API_KEY` into the `.env.local` file and completely restart the Next.js server to activate the AI Chatbot." 
      });
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const instId = new mongoose.Types.ObjectId(authUser.institute_id);

    // ═══════════════════════════════════════════════════════════════════
    // COMPREHENSIVE RAG: Full Database Retrieval
    // ═══════════════════════════════════════════════════════════════════
    
    // 1. ALL Students with their details
    const allStudents = await Student.find({ institute_id: instId })
      .populate("user_id", "name phoneOrEmail")
      .populate("batch_id", "name")
      .lean();

    // 2. ALL Fees with student linkage
    const allFees = await Fee.find({ institute_id: instId })
      .populate({ path: "student_id", populate: { path: "user_id", select: "name" } })
      .lean();

    const now = new Date();
    const studentsFull = allStudents.map(s => {
      const fee = allFees.find(f => f.student_id?._id?.toString() === s._id.toString());
      const daysOverdue = fee && fee.status !== "PAID" ? Math.max(0, Math.ceil((now - new Date(fee.due_date)) / (1000 * 60 * 60 * 24))) : 0;
      return {
        name: s.user_id?.name || "Unknown",
        contact: s.user_id?.phoneOrEmail || "",
        batch: s.batch_id?.name || "Unassigned",
        parent_name: s.parent_name || "",
        parent_phone: s.parent_phone || "",
        admission_date: s.admission_date ? new Date(s.admission_date).toLocaleDateString("en-CA") : "",
        fee_total: fee?.total_amount || 0,
        fee_paid: fee?.paid_amount || 0,
        fee_due: fee?.due_amount || 0,
        fee_status: fee?.status || "NO_RECORD",
        days_overdue: daysOverdue
      };
    });

    // 3. Batches with student counts
    const allBatches = await Batch.find({ institute_id: instId })
      .populate("teacher_id", "user_id")
      .lean();
    
    const batchSummary = allBatches.map(b => {
      const studentsInBatch = studentsFull.filter(s => s.batch === b.name);
      return {
        name: b.name,
        timing: b.timing || "",
        student_count: studentsInBatch.length,
        total_fees_due: studentsInBatch.reduce((sum, s) => sum + s.fee_due, 0),
        total_fees_collected: studentsInBatch.reduce((sum, s) => sum + s.fee_paid, 0)
      };
    });

    // 4. Courses
    const allCourses = await Course.find({ institute_id: instId }).lean();
    const courseList = allCourses.map(c => ({
      name: c.name,
      description: c.description || "",
      base_fee: c.base_fee || 0
    }));

    // 5. Revenue
    const totalRevenue = allFees.reduce((sum, f) => sum + (f.paid_amount || 0), 0);

    // 6. Attendance per batch
    const attendanceAgg = await Attendance.aggregate([
      { $match: { institute_id: instId } },
      { $group: { _id: { batch_id: "$batch_id", status: "$status" }, count: { $sum: 1 } } }
    ]);
    const attendanceLookup = {};
    for (const a of attendanceAgg) {
      const batchId = a._id.batch_id?.toString();
      if (!attendanceLookup[batchId]) attendanceLookup[batchId] = { present: 0, absent: 0 };
      if (a._id.status === "PRESENT") attendanceLookup[batchId].present += a.count;
      if (a._id.status === "ABSENT") attendanceLookup[batchId].absent += a.count;
    }
    for (const b of batchSummary) {
      const bDoc = allBatches.find(x => x.name === b.name);
      if (bDoc) {
        const att = attendanceLookup[bDoc._id.toString()];
        b.total_present = att?.present || 0;
        b.total_absent = att?.absent || 0;
      }
    }

    // 7. TODAY's attendance — per student
    // Align TODAY to IST
    const istOffset = 5.5 * 60 * 60 * 1000;
    const todayUTC = new Date(now.getTime() + istOffset);
    todayUTC.setUTCHours(0, 0, 0, 0);

    const todayAttendance = await Attendance.find({
      institute_id: instId,
      date: todayUTC
    }).populate({ path: "student_id", populate: { path: "user_id", select: "name" } })
      .populate("batch_id", "name")
      .lean();

    const todayAbsent = todayAttendance
      .filter(a => a.status === "ABSENT")
      .map(a => ({
        name: a.student_id?.user_id?.name || "Unknown",
        batch: a.batch_id?.name || "Unknown"
      }));

    const todayPresent = todayAttendance
      .filter(a => a.status === "PRESENT")
      .map(a => ({
        name: a.student_id?.user_id?.name || "Unknown",
        batch: a.batch_id?.name || "Unknown"
      }));

    // 8. Recent test results
    const recentTests = await Test.find({ institute_id: instId })
      .sort({ date: -1 })
      .limit(5)
      .populate("batch_id", "name")
      .lean();

    const recentTestDetails = [];
    for (const t of recentTests) {
      const testResults = await Result.find({ test_id: t._id })
        .populate({ path: "student_id", populate: { path: "user_id", select: "name" } })
        .lean();
      recentTestDetails.push({
        test_name: t.name,
        batch: t.batch_id?.name || "Unknown",
        date: new Date(t.date).toISOString().split("T")[0],
        total_marks: t.total_marks,
        scores: testResults.map(r => ({
          student: r.student_id?.user_id?.name || "Unknown",
          marks: r.marks,
          percentage: ((r.marks / t.total_marks) * 100).toFixed(1)
        }))
      });
    }

    // 9. Summary stats
    const totalStudents = studentsFull.length;
    const unpaidCount = studentsFull.filter(s => s.fee_status !== "PAID" && s.fee_status !== "NO_RECORD").length;
    const totalOutstanding = studentsFull.reduce((sum, s) => sum + s.fee_due, 0);

    // ═══════════════════════════════════════════════════════════════════
    // BUILD FULL CONTEXT FOR LLM
    // ═══════════════════════════════════════════════════════════════════

    const snapshot = {
      today: now.toLocaleDateString("en-CA", { timeZone: 'Asia/Kolkata' }),
      summary: {
        total_students: totalStudents,
        total_revenue_collected: totalRevenue,
        unpaid_students: unpaidCount,
        total_outstanding_balance: totalOutstanding
      },
      students: studentsFull,
      batches: batchSummary,
      courses: courseList,
      todays_attendance: {
        total_present: todayPresent.length,
        total_absent: todayAbsent.length,
        absent_students: todayAbsent,
        present_students: todayPresent
      },
      recent_tests: recentTestDetails
    };

    const systemPrompt = `You are the Admin Assistant for a Coaching Institute management system. You have COMPLETE access to the institute's real-time database snapshot below.

FULL DATABASE SNAPSHOT:
${JSON.stringify(snapshot)}

RULES:
1. Answer ONLY using the data above. Never invent or guess facts.
2. When users ask follow-up questions (e.g. "how much?", "which one?", "name them"), use the CONVERSATION HISTORY to understand what they are referring to, then find the answer in the database snapshot.
3. Be concise, professional, and use bullet points or tables when listing multiple items.
4. Format currency as ₹XX,XXX.
5. If data genuinely does not exist in the snapshot, say so clearly.
6. You CAN answer questions about: student names, fees, payments, batches, courses, attendance, revenue, defaulters, overdue days, and any comparison or ranking across these dimensions.`;

    // Build conversation messages with history
    const chatMessages = [{ role: "system", content: systemPrompt }];

    // Add conversation history (last 10 exchanges for context window efficiency)
    if (Array.isArray(history)) {
      const recentHistory = history.slice(-10);
      for (const h of recentHistory) {
        chatMessages.push({ role: h.role, content: h.content });
      }
    }

    // Add the current user message
    chatMessages.push({ role: "user", content: message });

    const chatCompletion = await groq.chat.completions.create({
      messages: chatMessages,
      model: "llama-3.3-70b-versatile",
      temperature: 0.1,
      max_tokens: 500
    });

    return NextResponse.json({ answer: chatCompletion.choices[0]?.message?.content || "No response generated by AI." });

  } catch (error) {
    console.error("Groq AI Error:", error);
    return NextResponse.json({ answer: "Oops! I encountered an error connecting to the AI models." }, { status: 500 });
  }
}
