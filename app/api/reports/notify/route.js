import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import Institute from "@/models/Institute";
import { sendEventToN8N } from "@/services/n8n";
import { GET as getAdminReport } from "../admin/route";

export async function POST(req) {
  try {
    const authUser = await requireRole(["ADMIN"]);
    const body = await req.json();
    const { dateFrom, dateTo, batchId } = body;

    const url = new URL("http://localhost/api/reports/admin");
    if (dateFrom) url.searchParams.set("dateFrom", dateFrom);
    if (dateTo) url.searchParams.set("dateTo", dateTo);
    if (batchId) url.searchParams.set("batchId", batchId);
    
    // Simulate Request to reuse Admin Aggregation Logic perfectly
    const mockReq = { url: url.toString() }; 
    const adminRes = await getAdminReport(mockReq);
    if (!adminRes.ok) return adminRes;
    
    const data = await adminRes.json();
    const students = data.students || [];
    
    const inst = await Institute.findById(authUser.institute_id);

    let sentCount = 0;
    const errors = [];

    for (const s of students) {
        if (!s.student.parent_phone || s.student.parent_phone === "—") {
             errors.push(`Skipped ${s.student.name}: No valid phone number.`);
             continue;
        }
        
        try {
            await sendEventToN8N({
                event_type: "monthly_report",
                timestamp: new Date().toISOString(),
                institute: {
                    id: inst._id.toString(),
                    name: inst.name
                },
                student: {
                    id: s.student.id,
                    name: s.student.name,
                    parent_phone: s.student.parent_phone,
                    batch_name: s.student.batch
                },
                data: {
                    period: `${dateFrom} to ${dateTo}`,
                    attendance: s.attendance,
                    fees: s.fees,
                    tests: s.tests
                }
            });
            sentCount++;
        } catch (err) {
            errors.push(`Failed to send to ${s.student.name}: ${err.message}`);
        }
    }

    return NextResponse.json({ success: true, sent: sentCount, errors });
  } catch (error) {
    console.error("Report Notify Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
