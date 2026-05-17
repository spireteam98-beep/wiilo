const express = require('express');
const axios = require('axios');
const cors = require('cors');
const admin = require('firebase-admin');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize Firebase Admin
try {
  if (admin.apps.length === 0) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      })
    });
    console.log('Firebase Admin initialized successfully');
  }
} catch (error) {
  console.error('Failed to initialize Firebase:', error);
  process.exit(1);
}

const db = admin.firestore();
const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors({
  origin: ['http://localhost:3000', 'https://checkout.paystack.com'],
  credentials: true,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Add security headers
app.use((req, res, next) => {
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'Server is running', timestamp: new Date().toISOString() });
});

// Paystack configuration
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
if (!PAYSTACK_SECRET_KEY) {
  console.error('Missing Paystack secret key');
  process.exit(1);
}

// Paystack initialization endpoint
app.post('/paystack/initialize', async (req, res) => {
  try {
    const { email, amount, metadata } = req.body;
    if (!email || !amount) {
      return res.status(400).json({
        status: false,
        message: 'Email and amount are required'
      });
    }

    const response = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        email,
        amount: amount * 100, // Convert to kobo/cents
        currency: 'KES',
        callback_url: `http://localhost:3000/dashboard`,
        channels: ['card'],
        metadata: {
          ...metadata,
          redirect_url: 'http://localhost:3000/dashboard'
        }
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Log the initialization response
    console.log('Payment initialized:', {
      reference: response.data.data.reference,
      access_url: response.data.data.authorization_url,
      callback_url: `http://localhost:3000/dashboard`
    });

    res.json(response.data);

  } catch (error) {
    console.error('Payment initialization error:', error.response?.data || error.message);
    res.status(500).json({
      status: false,
      message: 'Could not initialize payment',
      error: error.response?.data || error.message
    });
  }
});

// Verify transaction by reference
app.get('/paystack/verify/:reference', async (req, res) => {
  try {
    const { reference } = req.params;
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.status && response.data.data.status === 'success') {
      const { email, metadata, amount } = response.data.data;
      const userId = metadata.userId;
      const coinsToAdd = metadata.coins;

      // Update user document
      const userRef = db.collection('users').doc(userId);
      await db.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);
        const paymentData = {
          amount: amount / 100,
          coins: coinsToAdd,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          reference: reference,
          status: 'success'
        };

        if (!userDoc.exists) {
          transaction.set(userRef, {
            email,
            coins: coinsToAdd,
            lastPayment: paymentData,
            paymentHistory: [paymentData]
          });
        } else {
          const currentCoins = userDoc.data().coins || 0;
          transaction.update(userRef, {
            coins: currentCoins + coinsToAdd,
            lastPayment: paymentData,
            paymentHistory: admin.firestore.FieldValue.arrayUnion(paymentData)
          });
        }
      });

      console.log('Payment verified and processed:', {
        reference,
        userId,
        coinsAdded: coinsToAdd
      });
    }

    res.json(response.data);
  } catch (error) {
    console.error('Verification error:', error.response?.data || error.message);
    res.status(500).json({
      status: false,
      message: 'Could not verify payment',
      error: error.response?.data || error.message
    });
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    status: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
const server = app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
  console.log('Environment:', process.env.NODE_ENV);
}).on('error', (err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});