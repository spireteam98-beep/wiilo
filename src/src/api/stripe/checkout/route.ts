import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16", // Use the latest API version
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { amount, userId, userEmail, metadata } = body;

    // Create a Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "kes", // Matches your package currency
            product_data: {
              name: metadata.packageName,
              description: `Top up ${metadata.coins} coins for user ${userId}`,
            },
            unit_amount: Math.round(amount * 100), // Stripe expects amounts in cents/sub-units
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/exchange`,
      customer_email: userEmail,
      metadata: {
        userId: userId,
        coins: metadata.coins.toString(),
        packageName: metadata.packageName,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("STRIPE_CHECKOUT_ERROR:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}import { NextResponse } from "next/server";
import Stripe from "stripe";

// Initialize Stripe with your Secret Key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2023-10-16",
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { amount, userId, userEmail, metadata } = body;

    // 1. Validate Secret Key
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: "Stripe Secret Key missing" }, { status: 500 });
    }

    // 2. Create the Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "kes",
            product_data: {
              name: metadata.packageName || "Coin Purchase",
              description: `Buying ${metadata.coins} coins`,
            },
            unit_amount: Math.round(amount * 100), // KES 1 = 100 cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      // Redirect back to your site after payment
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/exchange`,
      customer_email: userEmail,
      metadata: {
        userId,
        coins: metadata.coins.toString(),
      },
    });

    // 3. Return the URL for the frontend to redirect
    return NextResponse.json({ url: session.url });

  } catch (error: any) {
    console.error("Stripe Backend Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create Stripe session" },
      { status: 500 }
    );
  }
}