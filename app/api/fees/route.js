import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import { getAuthUser, requireRole } from "@/lib/auth";
import Fee from "@/models/Fee";
import Student from "@/models/Student";
import Institute from "@/models/Institute";
import { sendEventToN8N } from "@/services/n8n";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    await dbConnect();
    const authUser = await getAuthUser();

    const { searchParams } = new URL(req.url);
    const student_id = searchParams.get("student_id");

    const query = { institute_id: authUser.institute_id };

    if (authUser.role === "TEACHER") {
      return NextResponse.json(
        { error: "Forbidden: Teachers do not have fee access" },
        { status: 403 }
      );
    } else if (authUser.role === "STUDENT") {
      const student = await Student.findOne(
        { user_id: authUser._id },
        { _id: 1 }
      ).lean();
      if (!student) return NextResponse.json([], { status: 200 });
      query.student_id = student._id;
    } else {
      if (student_id) query.student_id = student_id;
    }

    // --- AUTO-GENERATE MONTHLY RECURRING FEES ---
    if (authUser.role === "ADMIN" || authUser.role === "TEACHER") {
      const allLatestFees = await Fee.aggregate([
        { $match: { institute_id: authUser.institute_id } },
        { $sort: { due_date: -1 } },
        { $group: { _id: "$student_id", latestFee: { $first: "$$ROOT" } } }
      ]);

      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);

      const newFees = [];
      for (const f of allLatestFees) {
        let lastDueDate = new Date(f.latestFee.due_date);
        lastDueDate.setUTCHours(0, 0, 0, 0);
        let isLatestPaid = f.latestFee.status === "PAID";
        let iter = 0;

        // If the current active fee is already fully paid, or its billing cycle is completely over (<= today)
        // We must generate the next month's invoice so there's always an active future/upcoming cycle
        while ((today >= lastDueDate || isLatestPaid) && iter < 12) {
          lastDueDate.setDate(lastDueDate.getDate() + 30);
          
          newFees.push({
            student_id: f._id,
            total_amount: f.latestFee.total_amount,
            paid_amount: 0,
            due_amount: f.latestFee.total_amount,
            due_date: new Date(lastDueDate),
            status: "DUE",
            institute_id: authUser.institute_id,
          });
          
          isLatestPaid = false; // Next generated month is explicitly unpaid!
          iter++;
        }
      }

      if (newFees.length > 0) {
        await Fee.insertMany(newFees);
      }
    }
    // ---------------------------------------------

    const fees = await Fee.find(query)
      .select("student_id total_amount paid_amount due_amount due_date status")
      .populate({
        path: "student_id",
        select: "parent_name parent_phone user_id",
        populate: { path: "user_id", select: "name" },
      })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(fees);
  } catch (error) {
    console.error("Fees GET error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await dbConnect();
    const authUser = await requireRole(["ADMIN"]);

    const body = await req.json();
    const { student_id, total_amount, due_date } = body;

    const fee = await Fee.create({
      student_id,
      total_amount,
      paid_amount: 0,
      due_amount: total_amount,
      due_date,
      status: "DUE",
      institute_id: authUser.institute_id,
    });

    // Fire webhook without blocking the response
    setImmediate(async () => {
      try {
        const student = await Student.findById(student_id)
          .select("parent_phone parent_name batch_id user_id")
          .populate("batch_id", "name")
          .populate("user_id", "name")
          .lean();
        const inst = await Institute.findById(authUser.institute_id, { name: 1 }).lean();

        if (student && inst) {
          await sendEventToN8N({
            event_type: "fee_reminder",
            timestamp: new Date().toISOString(),
            institute: { id: inst._id.toString(), name: inst.name },
            student: {
              id: student._id.toString(),
              name: student.user_id?.name || student.parent_name || "Student",
              parent_phone: student.parent_phone,
              batch_name: student.batch_id?.name || "Unknown",
            },
            data: { due_amount: fee.due_amount, due_date: fee.due_date, days_overdue: 0 },
          });
        }
      } catch (e) {
        console.error("Fee webhook error:", e.message);
      }
    });

    return NextResponse.json(fee, { status: 201 });
  } catch (error) {
    console.error("Fees POST error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
