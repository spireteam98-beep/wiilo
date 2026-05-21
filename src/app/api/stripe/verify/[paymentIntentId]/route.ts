import { NextResponse } from "next/server";
import Stripe from "stripe";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase-admin";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ paymentIntentId: string }> }
) {
  if (!stripe) {
    return NextResponse.json(
      { success: false, message: "Stripe server configuration error." },
      { status: 500 }
    );
  }

  try {
    const { paymentIntentId } = await params;
    if (!paymentIntentId) {
      return NextResponse.json(
        { success: false, message: "Payment intent id is required." },
        { status: 400 }
      );
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (paymentIntent.status !== "succeeded") {
      return NextResponse.json(
        { success: false, message: "Payment was not successful." },
        { status: 400 }
      );
    }

    const metadata = paymentIntent.metadata || {};
    const userId = String(metadata.userId || "").trim();
    const coinsToAdd = Number(metadata.coins || 0);

    if (!userId || !coinsToAdd || coinsToAdd <= 0) {
      return NextResponse.json(
        { success: false, message: "Payment metadata is missing user or coin information." },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    const userRef = db.collection("users").doc(userId);

    await db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);
      const existingHistory = userDoc.exists ? userDoc.data()?.paymentHistory || [] : [];
      const alreadyCredited =
        Array.isArray(existingHistory) &&
        existingHistory.some((entry: any) => entry?.reference === paymentIntent.id);

      if (alreadyCredited) return;

      const paymentRecord = {
        amount: paymentIntent.amount / 100,
        coins: coinsToAdd,
        timestamp: Timestamp.now(),
        reference: paymentIntent.id,
        status: paymentIntent.status,
        gateway: "stripe",
        packageName: metadata.packageName || "N/A",
        currency: paymentIntent.currency,
      };

      if (!userDoc.exists) {
        transaction.set(userRef, {
          uid: userId,
          email: metadata.email || "N/A",
          name: "New User",
          photoURL: null,
          coins: coinsToAdd,
          paymentHistory: [paymentRecord],
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
          lastLogin: FieldValue.serverTimestamp(),
          profileComplete: false,
          isAdmin: false,
          freeArticleReads: [],
          freeContentConsumedCount: 0,
          consumedContentIds: [],
          likedContentIds: [],
          savedContentIds: [],
          preferredCategories: [],
        });
        return;
      }

      const currentCoins = Number(userDoc.data()?.coins || 0);
      transaction.update(userRef, {
        coins: currentCoins + coinsToAdd,
        paymentHistory: FieldValue.arrayUnion(paymentRecord),
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    return NextResponse.json({
      success: true,
      message: "Payment verified and coins credited.",
      credited: true,
      coinsAdded: coinsToAdd,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: String(error?.message || error) },
      { status: 500 }
    );
  }
}
