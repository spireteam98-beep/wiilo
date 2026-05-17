import crypto from 'crypto';
import { firestoreDb } from './firebase-admin';

/**
 * OAuth Code Interface
 */
export interface OAuthCode {
  code: string;
  clientId: string;
  userId: string;
  scope: string[];
  redirectUri: string;
  expiresAt: Date;
  createdAt: Date;
  createdFromIp: string;
  used: boolean;
  usedAt?: Date;
}

/**
 * OAuth Token Interface
 */
export interface OAuthToken {
  token: string; // hashed
  tokenPlain?: string; // only for returning to user, never stored
  clientId: string;
  userId: string;
  scope: string[];
  expiresAt: Date;
  createdAt: Date;
  lastUsedAt?: Date;
  revoked: boolean;
  clientIpAddress: string;
  userAgent?: string;
}

/**
 * Generate and save authorization code to Firestore
 */
export async function generateAndSaveAuthCode(
  clientId: string,
  userId: string,
  scope: string[],
  redirectUri: string,
  ipAddress: string,
  expirationMinutes: number = 10
): Promise<string> {
  try {
    const code = crypto.randomBytes(32).toString('hex');
    const now = new Date();
    const expiresAt = new Date(now.getTime() + expirationMinutes * 60 * 1000);

    const oauthCode: OAuthCode = {
      code,
      clientId,
      userId,
      scope,
      redirectUri,
      expiresAt,
      createdAt: now,
      createdFromIp: ipAddress,
      used: false,
    };

    // Save to Firestore
    await firestoreDb
      .collection('oauth_codes')
      .doc(code)
      .set(oauthCode);

    return code;
  } catch (error) {
    console.error('Error saving auth code:', error);
    throw new Error('Failed to generate authorization code');
  }
}

/**
 * Retrieve authorization code from Firestore
 */
export async function getAuthCode(code: string): Promise<OAuthCode | null> {
  try {
    const doc = await firestoreDb
      .collection('oauth_codes')
      .doc(code)
      .get();

    if (!doc.exists) {
      return null;
    }

    const data = doc.data() as OAuthCode;
    
    // Convert Firestore timestamps to Date objects
    if (data.expiresAt && typeof data.expiresAt === 'object' && 'toDate' in data.expiresAt) {
      data.expiresAt = data.expiresAt.toDate();
    }
    if (data.createdAt && typeof data.createdAt === 'object' && 'toDate' in data.createdAt) {
      data.createdAt = data.createdAt.toDate();
    }
    if (data.usedAt && typeof data.usedAt === 'object' && 'toDate' in data.usedAt) {
      data.usedAt = data.usedAt.toDate();
    }

    return data;
  } catch (error) {
    console.error('Error retrieving auth code:', error);
    return null;
  }
}

/**
 * Mark authorization code as used
 */
export async function markAuthCodeAsUsed(code: string): Promise<void> {
  try {
    await firestoreDb
      .collection('oauth_codes')
      .doc(code)
      .update({
        used: true,
        usedAt: new Date(),
      });
  } catch (error) {
    console.error('Error marking auth code as used:', error);
  }
}

/**
 * Hash token for storage (never store plain tokens)
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Generate and save access token to Firestore
 */
export async function generateAndSaveToken(
  clientId: string,
  userId: string,
  scope: string[],
  ipAddress: string,
  userAgent: string | undefined,
  expirationHours: number = 1
): Promise<string> {
  try {
    const tokenPlain = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(tokenPlain);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + expirationHours * 60 * 60 * 1000);

    const oauthToken: OAuthToken = {
      token: tokenHash,
      clientId,
      userId,
      scope,
      expiresAt,
      createdAt: now,
      revoked: false,
      clientIpAddress: ipAddress,
      userAgent,
    };

    // Save to Firestore
    await firestoreDb
      .collection('oauth_tokens')
      .doc(tokenHash)
      .set(oauthToken);

    // Return plain token (only time it's returned)
    return tokenPlain;
  } catch (error) {
    console.error('Error saving token:', error);
    throw new Error('Failed to generate access token');
  }
}

/**
 * Retrieve token from Firestore by hashed value
 */
export async function getToken(tokenPlain: string): Promise<OAuthToken | null> {
  try {
    const tokenHash = hashToken(tokenPlain);
    const doc = await firestoreDb
      .collection('oauth_tokens')
      .doc(tokenHash)
      .get();

    if (!doc.exists) {
      return null;
    }

    const data = doc.data() as OAuthToken;
    
    // Convert Firestore timestamps to Date objects
    if (data.expiresAt && typeof data.expiresAt === 'object' && 'toDate' in data.expiresAt) {
      data.expiresAt = data.expiresAt.toDate();
    }
    if (data.createdAt && typeof data.createdAt === 'object' && 'toDate' in data.createdAt) {
      data.createdAt = data.createdAt.toDate();
    }
    if (data.lastUsedAt && typeof data.lastUsedAt === 'object' && 'toDate' in data.lastUsedAt) {
      data.lastUsedAt = data.lastUsedAt.toDate();
    }

    return data;
  } catch (error) {
    console.error('Error retrieving token:', error);
    return null;
  }
}

/**
 * Check if token is valid (exists, not expired, not revoked)
 */
export function isTokenValid(token: OAuthToken | null): boolean {
  if (!token) return false;
  if (token.revoked) return false;
  if (new Date() > token.expiresAt) return false;
  return true;
}

/**
 * Check if authorization code is valid (exists, not expired, not used)
 */
export function isAuthCodeValid(code: OAuthCode | null): boolean {
  if (!code) return false;
  if (code.used) return false;
  if (new Date() > code.expiresAt) return false;
  return true;
}

/**
 * Update token last used timestamp
 */
export async function updateTokenLastUsed(tokenHash: string): Promise<void> {
  try {
    await firestoreDb
      .collection('oauth_tokens')
      .doc(tokenHash)
      .update({
        lastUsedAt: new Date(),
      });
  } catch (error) {
    console.error('Error updating token last used:', error);
  }
}

/**
 * Log OAuth event to audit collection
 */
export async function logOAuthEvent(event: {
  eventType: 'auth_requested' | 'auth_approved' | 'auth_denied' | 'token_issued' | 'token_used' | 'token_revoked' | 'error';
  clientId: string;
  userId?: string;
  scope?: string[];
  status: 'success' | 'failure';
  errorCode?: string;
  errorMessage?: string;
  ipAddress: string;
  userAgent?: string;
}): Promise<void> {
  try {
    const docRef = firestoreDb.collection('oauth_audit_logs').doc();
    await docRef.set({
      ...event,
      timestamp: new Date(),
      id: docRef.id,
    });
  } catch (error) {
    console.error('Error logging OAuth event:', error);
  }
}
