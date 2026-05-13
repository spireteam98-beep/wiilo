import type { NextApiRequest, NextApiResponse } from 'next';

const WAAFI_API_KEY = process.env.WAAFI_API_KEY || "API-1922135978AHX";
const WAAFI_MERCHANT_ID = process.env.WAAFI_MERCHANT_ID || "M0910161";
const WAAFI_API_USER_ID = process.env.WAAFI_API_USER_ID || "1000146";
const WAAFI_API_ENDPOINT_INITIATE = "https://api.waafipay.net/asm";

interface WaafiInitiateRequestBody {
  amount: number;
  currency: string;
  phoneNumber: string;
  userId: string;
  metadata: {
    coins: number;
    packageName: string;
    originalAmountKES: number;
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  const { amount, currency, phoneNumber, userId, metadata } = req.body as WaafiInitiateRequestBody;

  if (!amount || !currency || !phoneNumber || !userId || !metadata) {
    return res.status(400).json({ success: false, message: "Missing required payment details." });
  }

  // Build the payload to match your Postman example
  const transactionId = `WAAFI_${userId}_${Date.now()}`;
  const waafiPayload = {
    schemaVersion: "1.0",
    requestId: transactionId,
    timestamp: Math.floor(Date.now() / 1000).toString(), // UNIX timestamp as string
    channelName: "WEB",
    serviceName: "API_PURCHASE",
    serviceParams: {
      merchantUid: WAAFI_MERCHANT_ID,
      apiUserId: WAAFI_API_USER_ID,
      apiKey: WAAFI_API_KEY,
      paymentMethod: "MWALLET_ACCOUNT",
      payerInfo: {
        accountNo: phoneNumber,
      },
      transactionInfo: {
        referenceId: transactionId,
        invoiceId: `INV_${transactionId}`,
        amount: amount.toString(),
        currency: currency,
        description: `Purchase: ${metadata.packageName} (${metadata.coins} coins)`,
      },
    },
  };

  try {
    const response = await fetch(WAAFI_API_ENDPOINT_INITIATE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${WAAFI_API_KEY}`,
      },
      body: JSON.stringify(waafiPayload),
    });

    const contentType = response.headers.get('content-type');
    let waafiResult: any;
    if (contentType && contentType.includes('application/json')) {
      waafiResult = await response.json();
    } else {
      const errorText = await response.text();
      return res.status(500).json({ success: false, message: `Waafi API error: ${response.status} - ${errorText.substring(0, 100)}` });
    }

    // Adjust this check to your Waafi API's actual success flag
    if (!response.ok || waafiResult.responseCode !== "2001") {
      return res.status(500).json({
        success: false,
        message: waafiResult.responseMsg || 'Failed to initiate payment with Waafi.',
        waafiResult,
      });
    }

    return res.status(200).json({
      success: true,
      message: waafiResult.responseMsg,
      waafiResult,
    });

  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Internal server error during Waafi payment initiation.' });
  }
}