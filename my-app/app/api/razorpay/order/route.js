import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import connectDb from "@/db/connectDB";
import Payment from "@/models/Payment";
import User from "@/models/User";
import { validateContributionInput } from "@/lib/contribution-validation";
import {
  getRazorpayTestCredentials,
  razorpayRequest,
} from "@/lib/razorpay-test";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const input = await request.json();
    const validation = validateContributionInput(input);

    if (!validation.ok) {
      return NextResponse.json(validation, { status: 400 });
    }

    const { username, name, message, amount } = validation.value;
    const { keyId } = getRazorpayTestCredentials();

    await connectDb();

    const creator = await User.findOne({ username })
      .select("_id name username")
      .lean();

    if (!creator) {
      return NextResponse.json(
        { ok: false, error: "This creator page no longer exists." },
        { status: 404 },
      );
    }

    const receipt = `gf_${Date.now()}_${randomUUID().slice(0, 8)}`;
    const order = await razorpayRequest("/orders", {
      method: "POST",
      body: JSON.stringify({
        amount: amount * 100,
        currency: "INR",
        receipt,
        notes: {
          creator: creator.username,
          mode: "GetFunds portfolio test",
        },
      }),
    });

    if (!order?.id || order.amount !== amount * 100) {
      throw new Error("Razorpay returned an invalid test order.");
    }

    await Payment.create({
      creatorId: creator._id,
      name,
      to_user: creator.username,
      oid: order.id,
      message,
      amount,
      mode: "razorpay-test",
      status: "pending",
      done: false,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    return NextResponse.json({
      ok: true,
      checkout: {
        keyId,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        creatorName: creator.name || creator.username,
        supporterName: name,
      },
    });
  } catch (error) {
    const configurationError =
      error.message?.includes("not configured") ||
      error.message?.includes("Only Razorpay Test Mode");

    return NextResponse.json(
      { ok: false, error: error.message || "Could not create a Razorpay test order." },
      { status: configurationError ? 503 : 500 },
    );
  }
}
