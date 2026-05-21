import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

export async function POST(request: Request) {
  if (!stripe) {
    return NextResponse.json(
      { success: false, message: "Stripe server configuration error." },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const amount = Number(body?.amount);
    const coins = Number(body?.coins);
    const userId = String(body?.userId || "").trim();
    const email = String(body?.email || "").trim();
    const packageName = String(body?.packageName || "").trim();

    if (!amount || amount <= 0 || !coins || coins <= 0 || !userId || !email) {
      return NextResponse.json(
        { success: false, message: "amount, coins, userId, and email are required." },
        { status: 400 }
      );
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: "kes",
      receipt_email: email,
      payment_method_types: ["card"],
      metadata: {
        userId,
        email,
        coins: String(coins),
        packageName,
      },
    });

    return NextResponse.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: String(error?.message || error) },
      { status: 500 }
    );
  }
}
