import crypto from "node:crypto";

function errorResponse(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

export async function POST(request: Request) {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    console.error("[verify-payment] Razorpay server configuration is incomplete");
    return errorResponse("Payments are not configured right now.", 500);
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return errorResponse("Invalid payment verification request.", 400);
  }

  if (!payload || typeof payload !== "object") return errorResponse("Invalid payment verification request.", 400);
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = payload as Record<string, unknown>;
  if (typeof razorpayOrderId !== "string" || typeof razorpayPaymentId !== "string" || typeof razorpaySignature !== "string") {
    return errorResponse("Incomplete payment verification data.", 400);
  }

  const expectedSignature = crypto.createHmac("sha256", keySecret).update(`${razorpayOrderId}|${razorpayPaymentId}`).digest("hex");
  const expectedBuffer = Buffer.from(expectedSignature, "utf8");
  const receivedBuffer = Buffer.from(razorpaySignature, "utf8");
  const valid = expectedBuffer.length === receivedBuffer.length && crypto.timingSafeEqual(expectedBuffer, receivedBuffer);

  if (!valid) {
    console.warn("[verify-payment] Razorpay signature verification failed");
    return errorResponse("Payment verification failed.", 400);
  }

  return Response.json({ verified: true, mode: "test" });
}
