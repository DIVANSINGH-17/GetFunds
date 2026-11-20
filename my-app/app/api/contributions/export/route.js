import Payment from "@/models/Payment";
import { requireCurrentUser } from "@/lib/current-user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_EXPORT_ROWS = 5000;

// Quote every field and neutralise spreadsheet formula injection
// (values starting with =, +, -, @ are prefixed with an apostrophe).
const csvField = (value) => {
  let text = value === null || value === undefined ? "" : String(value);

  if (/^[=+\-@\t\r]/.test(text)) {
    text = `'${text}`;
  }

  return `"${text.replace(/"/g, '""')}"`;
};

export async function GET() {
  try {
    const user = await requireCurrentUser();
    const contributions = await Payment.find({
      done: true,
      $or: [
        { creatorId: user._id },
        { to_user: user.username },
      ],
    })
      .select("name message amount mode paymentId createdAt")
      .sort({ createdAt: -1 })
      .limit(MAX_EXPORT_ROWS)
      .lean();

    const header = ["Date", "Supporter", "Amount (INR)", "Message", "Mode", "Payment ID"];
    const rows = contributions.map((payment) => [
      payment.createdAt ? new Date(payment.createdAt).toISOString() : "",
      payment.name,
      payment.amount,
      payment.message || "",
      payment.mode || "demo",
      payment.paymentId || "",
    ]);

    const csv = [header, ...rows]
      .map((row) => row.map(csvField).join(","))
      .join("\r\n");
    const filename = `getfunds-${user.username}-contributions-${new Date().toISOString().slice(0, 10)}.csv`;

    return new Response(`﻿${csv}\r\n`, {
      headers: {
        "Cache-Control": "no-store",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Type": "text/csv; charset=utf-8",
      },
    });
  } catch (error) {
    const unauthenticated = error.message?.includes("signed in");

    return new Response(
      unauthenticated ? "Sign in to export contributions." : "Could not export contributions.",
      { status: unauthenticated ? 401 : 500 },
    );
  }
}
