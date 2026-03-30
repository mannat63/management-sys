import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import { requireRole } from "@/lib/auth";
import Fee from "@/models/Fee";
import Student from "@/models/Student";
import User from "@/models/User";

export async function GET(req) {
  try {
    await dbConnect();
    const authUser = await requireRole(["ADMIN"]);

    // --- AUTO-GENERATE MONTHLY RECURRING FEES ---
    const allLatestFees = await Fee.aggregate([
      { $match: { institute_id: authUser.institute_id } },
      { $sort: { due_date: -1 } },
      { $group: { _id: "$student_id", latestFee: { $first: "$$ROOT" } } }
    ]);
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    for (const f of allLatestFees) {
      let lastDueDate = new Date(f.latestFee.due_date);
      lastDueDate.setUTCHours(0, 0, 0, 0);
      let isLatestPaid = f.latestFee.status === "PAID";
      let iter = 0;

      while ((today >= lastDueDate || isLatestPaid) && iter < 12) {
        lastDueDate.setDate(lastDueDate.getDate() + 30);
        lastDueDate.setUTCHours(0, 0, 0, 0);

        try {
          const exists = await Fee.findOne({
            student_id: f._id,
            institute_id: authUser.institute_id,
            due_date: lastDueDate
          }).lean();

          if (!exists) {
            await Fee.create({
              student_id: f._id,
              total_amount: f.latestFee.total_amount,
              paid_amount: 0,
              due_amount: f.latestFee.total_amount,
              due_date: new Date(lastDueDate),
              status: "DUE",
              institute_id: authUser.institute_id,
            });
          }
        } catch (err) {
          console.log("Duplicate fee prevented in Defaulters API.");
        }
        isLatestPaid = false;
        iter++;
      }
    }
    // ---------------------------------------------

    // Find all fees that are not PAID
    const overdueFees = await Fee.find({ 
      institute_id: authUser.institute_id,
      status: { $ne: "PAID" }
    })
    .populate({
      path: "student_id",
      select: "parent_name parent_phone user_id",
      populate: {
        path: "user_id",
        select: "name"
      }
    })
    .lean();

    const targetDate = new Date();
    targetDate.setUTCHours(0,0,0,0);

    const defaulters = overdueFees.map(fee => {
      const dueDate = new Date(fee.due_date);
      // Ensure due_date is also at midnight UTC for fair calculation
      dueDate.setUTCHours(0,0,0,0);
      
      const diffTime = targetDate.getTime() - dueDate.getTime();
      const daysOverdue = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      const studentName = fee.student_id?.user_id?.name || fee.student_id?.parent_name || "Unknown Student";
      
      return {
        _id: fee._id,
        student_id: fee.student_id?._id,
        name: studentName,
        parent_phone: fee.student_id?.parent_phone || "—",
        due_amount: fee.due_amount,
        paid_amount: fee.paid_amount,
        total_amount: fee.total_amount,
        due_date: fee.due_date,
        days_overdue: daysOverdue
      };
    });

    // Sort by most overdue first
    defaulters.sort((a, b) => b.days_overdue - a.days_overdue);

    return NextResponse.json(defaulters);
  } catch (error) {
    console.error("Defaulters API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
