# src54 Payment Gateway and Content Guard Guideline

## Purpose

This document combines the main payment gateway patterns and content-access guard logic that were already working in `src54`. It is intended as the single reference for how the old project handled:

1. Wallet top-up payments
2. Gateway verification and coin crediting
3. Content-access charging
4. Firestore data expectations
5. Migration guidance into the active `src/` app

## Source Files Reviewed

Payment UI and orchestration:

1. `src54/components/exchange/Pay.tsx`
2. `src54/components/exchange/PaystackButton.tsx`
3. `src54/components/exchange/StripeButton.tsx`
4. `src54/components/exchange/WaafiButton.tsx`

Payment backend:

1. `src54/app/api/paystack/verify/route.ts`
2. `src54/app/api/stripe/checkout/route.ts`

Content-access guard:

1. `src54/lib/contentAccess.ts`
2. `src54/contexts/PlayerContext.tsx`

## High-Level Architecture

The old project separated payment and content monetization into two distinct flows:

1. Payment gateways added coins to a user wallet.
2. Content guard consumed either a free entitlement or coins when content was first opened.

That means the system was not charging the gateway directly per piece of content. Instead:

1. User buys a coin package.
2. Backend verifies gateway result.
3. Backend credits `users/{uid}.coins`.
4. Client-side content guard deducts coins or free plays on first content access.

## Firestore Data Model Used by src54

The old payment and guard logic assumed a top-level user document at:

1. `users/{uid}`

Important fields expected on that document:

1. `uid: string`
2. `email: string | null`
3. `coins: number`
4. `paymentHistory: array`
5. `freeContentConsumedCount: number`
6. `consumedContentIds: string[]`
7. `likedContentIds: string[]`
8. `savedContentIds: string[]`
9. `preferredCategories: string[]`
10. `createdAt`
11. `updatedAt`
12. `lastLogin`

The two wallet-related fields that matter most for content access are:

1. `coins`
2. `consumedContentIds`

The free-tier fields were:

1. `freeContentConsumedCount`
2. `FREE_LIMIT = 10`

## Payment Gateway Patterns in src54

### Paystack Pattern

Primary frontend file:

1. `src54/components/exchange/PaystackButton.tsx`

Behavior:

1. Requires authenticated user email.
2. Sends package purchase request to backend `POST ${NEXT_PUBLIC_PAYMENT_BACKEND_URL}/paystack/initialize`.
3. Backend returns Paystack authorization URL.
4. Frontend opens Paystack in a new tab.
5. After payment, verification happens on backend and coins are credited to Firestore.

Payload shape sent from frontend:

1. `email`
2. `amount`
3. `metadata.userId`
4. `metadata.coins`
5. `metadata.packageName`
6. `metadata.userName`
7. `metadata.userEmail`

Critical idea:

Paystack metadata is the bridge between gateway success and wallet credit. Without `userId` and `coins` in metadata, backend cannot safely assign the purchase.

### Stripe Pattern

Primary frontend file:

1. `src54/components/exchange/StripeButton.tsx`

Primary backend file:

1. `src54/app/api/stripe/checkout/route.ts`

Behavior:

1. Frontend renders Stripe `CardElement` inside `Elements`.
2. Frontend requests a payment intent from backend.
3. Backend creates Stripe `PaymentIntent` using amount and metadata.
4. Frontend confirms card payment using `stripe.confirmCardPayment`.
5. On success, frontend calls backend verify endpoint to add coins to Firebase.

Important implementation details:

1. Stripe publishable key is used on client.
2. Stripe secret key is used only on backend.
3. Metadata carries `userId` and `coins`.
4. Backend is responsible for authoritative coin crediting.

Critical idea:

Do not trust frontend success alone. Stripe card confirmation must be followed by backend verification or backend-side authoritative completion logic.

### Waafi Pattern

Primary frontend file:

1. `src54/components/exchange/WaafiButton.tsx`

Behavior:

1. User enters phone number.
2. Frontend builds Waafi-compatible payload.
3. Frontend sends request to backend initiate endpoint.
4. Backend triggers mobile wallet payment prompt.
5. Backend callback later credits wallet coins.

Important payload characteristics:

1. `schemaVersion`
2. `requestId`
3. `timestamp`
4. `channelName`
5. `serviceName`
6. `serviceParams.merchantUid`
7. `serviceParams.apiUserId`
8. `serviceParams.apiKey`
9. `serviceParams.paymentMethod`
10. `serviceParams.payerInfo.accountNo`
11. `serviceParams.transactionInfo`
12. `customMetadata`

Critical idea:

Waafi flow is asynchronous by design. Treat callback verification as the only trusted moment to add coins.

## Payment Orchestration UI Pattern

Primary file:

1. `src54/components/exchange/Pay.tsx`

What it did:

1. Present payment method choices.
2. Present fixed coin packages.
3. Build consistent metadata payload.
4. Render the gateway-specific button/form depending on selected payment method.

This component worked as the coordinator, not the processor.

Good pattern to preserve:

1. Shared package model
2. Shared `userId`
3. Shared `userEmail`
4. Shared `metadata.coins`
5. Shared `metadata.packageName`

## Backend Wallet Crediting Pattern

### Paystack Verify Route

Primary file:

1. `src54/app/api/paystack/verify/route.ts`

What it did:

1. Accept payment reference.
2. Verify reference against Paystack API using secret key.
3. Validate result is successful.
4. Read `metadata.userId` and `metadata.coins`.
5. Build payment record.
6. Create or update `users/{uid}`.
7. Increase `coins`.
8. Append to `paymentHistory`.

Important backend record fields:

1. `amount`
2. `coins`
3. `timestamp`
4. `reference`
5. `status`
6. `gateway`
7. `packageName`
8. `gatewayResponseSummary`

Important resilience behavior:

If user doc did not exist, route created it with wallet defaults.

### Stripe Checkout Route

Primary file:

1. `src54/app/api/stripe/checkout/route.ts`

What it did:

1. Read `amount`, `userId`, `metadata`.
2. Create `PaymentIntent`.
3. Attach `userId` and `coins` in Stripe metadata.
4. Return `clientSecret`.

Critical idea:

The backend must be the owner of amount normalization, secret usage, and payment metadata trust boundary.

## Content Guard Pattern in src54

Primary files:

1. `src54/lib/contentAccess.ts`
2. `src54/contexts/PlayerContext.tsx`

### Guard Philosophy

The old project treated content consumption as immediate on first access attempt.

That means:

1. If user already consumed the content, access is free.
2. If user has remaining free entitlement, content is marked consumed.
3. Otherwise, coins are deducted.
4. If deduction/update fails, content is not granted.

### Core Constants

From `src54/lib/contentAccess.ts`:

1. `FREE_LIMIT = 10`
2. `CONTENT_COST = 10`
3. `LOW_BALANCE_THRESHOLD = 10`

### Access Decision Order

The old guard used this exact sequence:

1. Reject if no authenticated user or no loaded profile.
2. If `consumedContentIds` already contains `contentId`, allow access.
3. If `freeContentConsumedCount < FREE_LIMIT`, consume one free play.
4. Else if `coins >= CONTENT_COST`, deduct 10 coins.
5. Else deny access and ask user to top up.

### Firestore Update Pattern

On successful first-time access, guard updated:

1. `consumedContentIds: arrayUnion(contentId)`
2. `updatedAt: serverTimestamp()`
3. Either:
4. `freeContentConsumedCount: increment(1)`
5. Or `coins: increment(-CONTENT_COST)`

Critical idea:

Access and wallet mutation happen together. If the write fails, the content is not considered unlocked.

## PlayerContext Integration Pattern

Primary file:

1. `src54/contexts/PlayerContext.tsx`

What it did before playback:

1. Confirm authenticated user exists.
2. Confirm user profile exists.
3. Confirm track has an audio source.
4. Call `checkAndGrantContentAccess(track.id, userProfile, user.uid)`.
5. If granted, start playback.
6. If profile changed, refresh profile.
7. If balance is low, show warning toast.
8. If denied, show destructive toast and do not play.

This is the correct place for guard enforcement when the media entrypoint is a player action.

## Key Design Principles to Keep

### 1. Backend Owns Coin Crediting

Never add purchased coins directly from client after gateway UI success. Coin crediting must happen only after trusted backend verification.

### 2. Client Owns Content Unlock Request

Content unlock was intentionally client-triggered because it happens at the moment of playback/opening. That is acceptable only if rules strictly prevent client coin inflation.

### 3. Metadata Is Required

Every payment request should include enough metadata to reconstruct ownership and package meaning:

1. `userId`
2. `coins`
3. `packageName`
4. Optional `userName`
5. Optional `userEmail`

### 4. Wallet Schema Must Exist

The old code assumed the user document contains wallet and consumption fields. If those fields are absent, initialization must create them before access logic runs.

### 5. Already-Consumed Content Must Not Re-Charge

`consumedContentIds` is the deduplication mechanism. Preserve this behavior.

## Environment Variables Used by src54 Pattern

Client-side or shared:

1. `NEXT_PUBLIC_PAYMENT_BACKEND_URL`
2. `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
3. `NEXT_PUBLIC_WAAFI_MERCHANT_UID`
4. `NEXT_PUBLIC_WAAFI_API_USER_ID`
5. `NEXT_PUBLIC_WAAFI_API_KEY`

Server-side:

1. `STRIPE_SECRET_KEY`
2. `PAYSTACK_SECRET_KEY`
3. `FIREBASE_ADMIN_SDK_CONFIG` in old route pattern

In the active app, Firebase Admin was later adapted to use `FIREBASE_SERVICE_ACCOUNT_KEY` through `src/lib/firebase-admin.ts`.

## Migration Guidance for Active src App

### Payment Migration

When migrating src54 payment flows into active `src/`, preserve this order:

1. Add frontend selector/orchestrator UI.
2. Add gateway-specific frontend components.
3. Add backend routes for verify/create-intent/initiate.
4. Ensure backend writes wallet fields into top-level `users/{uid}`.
5. Validate Firestore rules allow owner wallet reads and controlled wallet deductions.

### Content Guard Migration

When migrating src54 guard logic into active `src/`, preserve this order:

1. Ensure login exists first.
2. Ensure wallet profile bootstrap exists.
3. Check content access before playback begins.
4. Deduct coins or grant free access only once per content item.
5. Refresh wallet/profile UI after unlock.

## Known Risks and Lessons Learned

### 1. Firestore Rules Must Match Runtime Collections

If guard reads top-level `users/{uid}`, rules must explicitly allow it. Old OmniBiz tenant rules alone are not enough.

### 2. Auth Token Race Can Trigger False Permission Errors

Immediately after sign-in, Firestore requests may fire before a fresh auth token is attached. Refreshing token before first guarded request can reduce this issue.

### 3. Legacy Documents May Miss Wallet Fields

Rules and client code must tolerate missing:

1. `coins`
2. `consumedContentIds`
3. `freeContentConsumedCount`

### 4. Free Tier and Paid Tier Must Be Intentionally Chosen

src54 used a hybrid model:

1. First 10 content unlocks free
2. Then 10 coins per content

If active app should be strictly coin-only, remove free-tier logic consistently from both code and messaging.

## Recommended Active-Project Standard

For the current `src/` app, the cleanest standard is:

1. Use top-level `users/{uid}` for wallet and playback-entitlement state.
2. Use backend verification for gateway coin crediting.
3. Use frontend content guard before media playback.
4. Keep `consumedContentIds` as unlock deduplication store.
5. Keep `paymentHistory` for audit.
6. Keep Firestore rules strict on wallet writes so client cannot increase coin balance.

## Implementation Checklist

Use this checklist whenever reproducing the src54 model:

1. User auth exists and user UID is available.
2. User wallet/profile doc exists in `users/{uid}`.
3. Payment package carries `coins` and `packageName`.
4. Gateway metadata carries `userId`.
5. Backend verifies gateway result before crediting.
6. Content guard checks already-consumed state.
7. Content guard deducts 10 coins on first paid unlock.
8. Wallet UI refreshes after payment or unlock.
9. Firestore rules allow owner reads and controlled deductions.
10. Old and new docs are both handled safely.
