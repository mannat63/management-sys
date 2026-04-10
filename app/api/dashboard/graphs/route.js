import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import { requireRole } from "@/lib/auth";
import Payment from "@/models/Payment";
import Attendance from "@/models/Attendance";
import Fee from "@/models/Fee";
import Test from "@/models/Test";
import Result from "@/models/Result";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await dbConnect();
    const authUser = await requireRole(["ADMIN"]);
    const iid = authUser.institute_id;

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 30);

    const todayStart = new Date();
    todayStart.setUTCHours(0,0,0,0);

    // ── All 4 data sources fetched in parallel via aggregation ──
    const [paymentAgg, attendanceAgg, feeAgg, testPerfAgg] = await Promise.all([

      // 1. Revenue per day (last 30 days)
      Payment.aggregate([
        { $match: { institute_id: iid, createdAt: { $gte: startDate, $lte: endDate } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            amount: { $sum: "$amount" },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // 2. Attendance % per day (aggregate, not full fetch)
      Attendance.aggregate([
        { $match: { institute_id: iid, date: { $gte: startDate, $lte: endDate } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
            total: { $sum: 1 },
            present: { $sum: { $cond: [{ $eq: ["$status", "PRESENT"] }, 1, 0] } },
          },
        },
        {
          $project: {
            presentPct: {
              $cond: [
                { $gt: ["$total", 0] },
                { $round: [{ $multiply: [{ $divide: ["$present", "$total"] }, 100] }, 0] },
                0,
              ],
            },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // 3. Fee totals (single $group, no full collection fetch)
      Fee.aggregate([
        { $match: { institute_id: iid } },
        {
          $group: {
            _id: null,
            collected: { $sum: "$paid_amount" },
            pending: { 
              $sum: {
                $cond: [ { $lt: ["$due_date", todayStart] }, "$due_amount", 0 ]
              }
            },
          },
        },
      ]),

      // 4. Test performance — single aggregate with $lookup to avoid N+1
      Test.aggregate([
        { $match: { institute_id: iid } },
        { $sort: { date: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: "results",
            localField: "_id",
            foreignField: "test_id",
            as: "results",
          },
        },
        {
          $project: {
            name: 1,
            date: 1,
            // Calculate total marks from subjects array OR fallback to old total_marks field
            maxPossible: {
              $cond: [
                { $gt: [{ $size: { $ifNull: ["$subjects", []] } }, 0] },
                { $sum: "$subjects.max_marks" },
                { $ifNull: ["$total_marks", 0] }
              ]
            },
            count: { $size: "$results" },
            // Sum up all marks from results (handles both new subject_marks array and old marks field)
            sumMarks: {
              $sum: {
                $map: {
                  input: "$results",
                  as: "r",
                  in: {
                    $add: [
                      { $ifNull: ["$$r.marks", 0] },
                      {
                        $reduce: {
                          input: { $ifNull: ["$$r.subject_marks", []] },
                          initialValue: 0,
                          in: { $add: ["$$value", { $ifNull: ["$$this.marks", 0] }] }
                        }
                      }
                    ]
                  }
                }
              }
            },
          },
        },
        {
          $project: {
            name: 1,
            date: 1,
            avgScore: {
              $cond: [
                { $and: [{ $gt: ["$count", 0] }, { $gt: ["$maxPossible", 0] }] },
                {
                  $round: [
                    { $multiply: [{ $divide: ["$sumMarks", { $multiply: ["$count", "$maxPossible"] }] }, 100] },
                    0,
                  ],
                },
                0,
              ],
            },
          },
        },
        { $sort: { date: 1 } }, // chronological for chart
      ]),
    ]);

    // ── Build revenue map (seed zeros for all 30 days) ──
    const revMap = {};
    for (let i = 0; i <= 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      revMap[d.toISOString().split("T")[0]] = 0;
    }
    paymentAgg.forEach((p) => {
      if (revMap[p._id] !== undefined) revMap[p._id] = p.amount;
    });
    const revenueData = Object.keys(revMap)
      .sort()
      .map((d) => ({
        date: new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        amount: revMap[d],
      }));

    // ── Attendance trend ──
    const attendanceData = attendanceAgg.map((a) => ({
      date: new Date(a._id).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      presentPct: a.presentPct,
    }));

    // ── Fee status ──
    const fees = feeAgg[0] || { collected: 0, pending: 0 };
    const feeData = [
      { name: "Collected", value: fees.collected, fill: "#10b981" },
      { name: "Pending", value: fees.pending, fill: "#f43f5e" },
    ];

    // ── Test performance ──
    const testData = testPerfAgg.map((t) => ({ name: t.name, avgScore: t.avgScore }));

    return NextResponse.json({
      revenue: revenueData,
      attendance: attendanceData,
      feesObj: feeData,
      tests: testData,
    });
  } catch (error) {
    console.error("Graphs API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
