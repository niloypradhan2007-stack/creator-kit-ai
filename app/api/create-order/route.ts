import Razorpay from "razorpay";

const orderAmount = 9900;
const orderCurrency = "INR";

function errorResponse(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

export async function POST() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    console.error("[create-order] Razorpay server configuration is incomplete");
    return errorResponse("Payments are not configured right now.", 500);
  }

  try {
    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const order = await razorpay.orders.create({ amount: orderAmount, currency: orderCurrency, receipt: `creator-kit-${Date.now()}` });
    return Response.json({ orderId: order.id, keyId });
  } catch (error) {
    console.error("[create-order] Razorpay order creation failed", { errorType: error instanceof Error ? error.name : "UnknownError" });
    return errorResponse("We could not start checkout. Please try again.", 500);
  }
}
