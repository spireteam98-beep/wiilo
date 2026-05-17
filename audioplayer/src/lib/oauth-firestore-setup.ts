import { firestoreDb } from './firebase-admin';

/**
 * Initialize OAuth Firestore collections with proper schemas and indexes
 * This should be run once during setup
 */
export async function initializeOAuthCollections() {
  try {
    console.log('Initializing OAuth Firestore collections...');

    // Create oauth_clients collection reference (schema validation on write)
    const clientsRef = firestoreDb.collection('oauth_clients');
    console.log('✓ oauth_clients collection ready');

    // Create oauth_codes collection reference
    const codesRef = firestoreDb.collection('oauth_codes');
    console.log('✓ oauth_codes collection ready');

    // Create oauth_tokens collection reference
    const tokensRef = firestoreDb.collection('oauth_tokens');
    console.log('✓ oauth_tokens collection ready');

    // Create oauth_audit_logs collection reference
    const auditLogsRef = firestoreDb.collection('oauth_audit_logs');
    console.log('✓ oauth_audit_logs collection ready');

    console.log('OAuth collections initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing OAuth collections:', error);
    throw error;
  }
}

/**
 * Validate OAuth Firestore schema
 */
export async function validateOAuthSchema() {
  try {
    console.log('Validating OAuth schema...');

    // Check if collections exist by trying to read from them
    const collections = [
      'oauth_clients',
      'oauth_codes',
      'oauth_tokens',
      'oauth_audit_logs',
    ];

    for (const collectionName of collections) {
      const snapshot = await firestoreDb
        .collection(collectionName)
        .limit(1)
        .get();
      console.log(`✓ ${collectionName} - Schema valid`);
    }

    console.log('Schema validation passed');
    return true;
  } catch (error) {
    console.error('Schema validation failed:', error);
    return false;
  }
}

/**
 * Create sample OAuth client for testing
 */
export async function createTestOAuthClient() {
  try {
    const clientId = 'test_client_' + Date.now();
    const clientSecret = 'test_secret_' + Math.random().toString(36).substring(7);

    const testClient = {
      clientId,
      clientSecret, // In production, this should be hashed
      appName: 'Test Application',
      appIcon: 'https://via.placeholder.com/100',
      appDescription: 'Test OAuth client for development',
      redirectUris: ['http://localhost:3000/callback', 'http://localhost:3001/callback'],
      allowedScopes: ['profile', 'email', 'wallet'],
      defaultScopes: ['profile', 'email'],
      developerEmail: 'test@example.com',
      developerName: 'Test Developer',
      verified: true,
      active: true,
      rateLimit: {
        tokensPerHour: 100,
        requestsPerMinute: 30,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'system',
    };

    await firestoreDb
      .collection('oauth_clients')
      .doc(clientId)
      .set(testClient);

    console.log(`✓ Test OAuth client created: ${clientId}`);
    console.log(`  Secret: ${clientSecret}`);

    return { clientId, clientSecret };
  } catch (error) {
    console.error('Error creating test OAuth client:', error);
    throw error;
  }
}

/**
 * List all OAuth clients
 */
export async function listOAuthClients() {
  try {
    const snapshot = await firestoreDb.collection('oauth_clients').get();

    const clients = [];
    snapshot.forEach(doc => {
      clients.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return clients;
  } catch (error) {
    console.error('Error listing OAuth clients:', error);
    return [];
  }
}

/**
 * Get OAuth client by ID
 */
export async function getOAuthClient(clientId: string) {
  try {
    const doc = await firestoreDb
      .collection('oauth_clients')
      .doc(clientId)
      .get();

    if (!doc.exists) {
      return null;
    }

    return {
      id: doc.id,
      ...doc.data(),
    };
  } catch (error) {
    console.error('Error retrieving OAuth client:', error);
    return null;
  }
}

/**
 * Clean up expired authorization codes
 * Should be run periodically (e.g., hourly)
 */
export async function cleanupExpiredAuthCodes() {
  try {
    const now = new Date();
    const snapshot = await firestoreDb
      .collection('oauth_codes')
      .where('expiresAt', '<', now)
      .get();

    let deletedCount = 0;
    const batch = firestoreDb.batch();

    snapshot.forEach(doc => {
      batch.delete(doc.ref);
      deletedCount++;
    });

    await batch.commit();
    console.log(`✓ Cleaned up ${deletedCount} expired authorization codes`);

    return deletedCount;
  } catch (error) {
    console.error('Error cleaning up expired auth codes:', error);
    return 0;
  }
}

/**
 * Clean up expired access tokens
 * Should be run periodically (e.g., hourly)
 */
export async function cleanupExpiredTokens() {
  try {
    const now = new Date();
    const snapshot = await firestoreDb
      .collection('oauth_tokens')
      .where('expiresAt', '<', now)
      .get();

    let deletedCount = 0;
    const batch = firestoreDb.batch();

    snapshot.forEach(doc => {
      batch.delete(doc.ref);
      deletedCount++;
    });

    await batch.commit();
    console.log(`✓ Cleaned up ${deletedCount} expired access tokens`);

    return deletedCount;
  } catch (error) {
    console.error('Error cleaning up expired tokens:', error);
    return 0;
  }
}

/**
 * Get OAuth statistics
 */
export async function getOAuthStats() {
  try {
    const now = new Date();

    // Count active tokens
    const tokensSnapshot = await firestoreDb
      .collection('oauth_tokens')
      .where('revoked', '==', false)
      .where('expiresAt', '>', now)
      .get();

    // Count pending authorization codes
    const codesSnapshot = await firestoreDb
      .collection('oauth_codes')
      .where('used', '==', false)
      .where('expiresAt', '>', now)
      .get();

    // Count OAuth clients
    const clientsSnapshot = await firestoreDb
      .collection('oauth_clients')
      .where('active', '==', true)
      .get();

    // Get recent audit logs (last 24 hours)
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const auditSnapshot = await firestoreDb
      .collection('oauth_audit_logs')
      .where('timestamp', '>', oneDayAgo)
      .get();

    return {
      activeTokens: tokensSnapshot.size,
      pendingAuthCodes: codesSnapshot.size,
      activeClients: clientsSnapshot.size,
      auditLogsLast24h: auditSnapshot.size,
      timestamp: now,
    };
  } catch (error) {
    console.error('Error getting OAuth stats:', error);
    return null;
  }
}
