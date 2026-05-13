import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { fetch } from 'undici';

interface PaystackResponse {
  status: boolean;
  data: {
    amount: number;
    status: string;
    reference: string;
  };
}

const COIN_PACKAGES = [
  { amount: 1000, coins: 100 },
  { amount: 2000, coins: 220 },
  { amount: 5000, coins: 600 },
];

export async function POST(req: Request) {
  try {
    const { reference, userId } = await req.json();

    // Verify payment with Paystack
    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const data = await response.json() as PaystackResponse;

    if (!data.status) {
      return NextResponse.json({ 
        success: false, 
        message: 'Payment verification failed' 
      }, { status: 400 });
    }

    // Get the amount paid and find matching package
    const amountPaid = data.data.amount / 100;
    const package_ = COIN_PACKAGES.find(pkg => pkg.amount === amountPaid);

    if (!package_) {
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid payment amount' 
      }, { status: 400 });
    }

    // Update user's coins in Firestore
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return NextResponse.json({ 
        success: false, 
        message: 'User not found' 
      }, { status: 404 });
    }

    const currentCoins = userSnap.data().coins || 0;
    await updateDoc(userRef, {
      coins: currentCoins + package_.coins
    });

    return NextResponse.json({
      success: true,
      data: {
        coinsAdded: package_.coins,
        newBalance: currentCoins + package_.coins
      }
    });

  } catch (error: any) {
    console.error('Payment verification error:', error);
    return NextResponse.json({ 
      success: false, 
      message: error.message || 'Payment verification failed' 
    }, { status: 500 });
  }
} 