import {
  createHmac,
  timingSafeEqual,
} from "node:crypto";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import connectDb from "@/db/connectDB";
import Payment from "@/models/Payment";
import {
  getRazorpayTestCredentials,
  razorpayRequest,
} from "@/lib/razorpay-test";

export const runtime = "nodejs";

const safeSignatureMatch = (expected, received) => {
  if (!/^[a-f0-9]{64}$/i.test(received)) {
    return false;
  }

  const expectedBuffer = Buffer.from(expected, "hex");
  const receivedBuffer = Buffer.from(received, "hex");

  return (
    expectedBuffer.length === receivedBuffer.length &&
    timingSafeEqual(expectedBuffer, receivedBuffer)
  );
};

export async function POST(request) {
  try {
    const body = await request.json();
    const orderId = String(body?.razorpay_order_id || "");
    const paymentId = String(body?.razorpay_payment_id || "");
    const signature = String(body?.razorpay_signature || "");

    if (!/^order_[a-zA-Z0-9]+$/.test(orderId)) {
      return NextResponse.json(
        { ok: false, error: "Invalid Razorpay test order identifier." },
        { status: 400 },
      );
    }

    if (!/^pay_[a-zA-Z0-9]+$/.test(paymentId)) {
      return NextResponse.json(
        { ok: false, error: "Invalid Razorpay test payment identifier." },
        { status: 400 },
      );
    }

    const { keySecret } = getRazorpayTestCredentials();
    await connectDb();

    const pendingPayment = await Payment.findOne({
      oid: orderId,
      mode: "razorpay-test",
    });

    if (!pendingPayment) {
      return NextResponse.json(
        { ok: false, error: "The pending test contribution was not found." },
        { status: 404 },
      );
    }

    if (pendingPayment.done) {
      if (pendingPayment.paymentId === paymentId) {
        return NextResponse.json({
          ok: true,
          message: "This Razorpay test payment was already verified.",
        });
      }

      return NextResponse.json(
        { ok: false, error: "This test order has already been completed." },
        { status: 409 },
      );
    }

    const expectedSignature = createHmac("sha256", keySecret)
      .update(`${pendingPayment.oid}|${paymentId}`)
      .digest("hex");

    if (!safeSignatureMatch(expectedSignature, signature)) {
      return NextResponse.json(
        { ok: false, error: "Razorpay payment signature verification failed." },
        { status: 400 },
      );
    }

    const remotePayment = await razorpayRequest(`/payments/${paymentId}`);
    const acceptedStatuses = new Set(["authorized", "captured"]);

    if (
      remotePayment?.order_id !== pendingPayment.oid ||
      remotePayment?.amount !== pendingPayment.amount * 100 ||
      remotePayment?.currency !== "INR" ||
      !acceptedStatuses.has(remotePayment?.status)
    ) {
      return NextResponse.json(
        { ok: false, error: "Razorpay could not confirm the expected test payment." },
        { status: 400 },
      );
    }

    const completedPayment = await Payment.findOneAndUpdate(
      { _id: pendingPayment._id, done: false },
      {
        $set: {
          paymentId,
          status: "completed",
          done: true,
        },
        $unset: {
          expiresAt: 1,
        },
      },
      { new: true },
    );

    if (!completedPayment) {
      return NextResponse.json(
        { ok: false, error: "This test payment was processed concurrently." },
        { status: 409 },
      );
    }

    revalidatePath(`/${pendingPayment.to_user}`);
    revalidatePath("/dashboard");

    return NextResponse.json({
      ok: true,
      message: "Razorpay test payment verified. No real money was moved.",
    });
  } catch (error) {
    const configurationError =
      error.message?.includes("not configured") ||
      error.message?.includes("Only Razorpay Test Mode");

    return NextResponse.json(
      { ok: false, error: error.message || "Could not verify the Razorpay test payment." },
      { status: configurationError ? 503 : 500 },
    );
  }
}
