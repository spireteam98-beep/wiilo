import { firestoreDb } from '@/lib/firebase-admin';

/**
 * OAuth Client Management Utilities
 * Server-side utilities for managing OAuth clients
 */

export interface OAuthClient {
  clientId: string;
  clientSecret?: string; // Only included during registration
  appName: string;
  appIcon?: string;
  appDescription?: string;
  redirectUris: string[];
  allowedScopes: string[];
  defaultScopes?: string[];
  developerEmail: string;
  developerName?: string;
  supportUrl?: string;
  verified: boolean;
  active: boolean;
  verificationDate?: Date;
  rateLimit?: {
    tokensPerHour: number;
    requestsPerMinute: number;
  };
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy?: string;
}

/**
 * Get OAuth client by ID
 */
export async function getOAuthClient(clientId: string): Promise<OAuthClient | null> {
  try {
    const doc = await firestoreDb.collection('oauth_clients').doc(clientId).get();
    if (!doc.exists) return null;

    const data = doc.data();
    if (!data) return null;

    // Don't return clientSecret
    delete data.clientSecret;

    return {
      clientId: doc.id,
      ...data,
    } as OAuthClient;
  } catch (error) {
    console.error('Error fetching OAuth client:', error);
    return null;
  }
}

/**
 * List all OAuth clients with optional filtering
 */
export async function listOAuthClients(filters?: {
  verified?: boolean;
  active?: boolean;
  email?: string;
}): Promise<OAuthClient[]> {
  try {
    let query = firestoreDb.collection('oauth_clients');

    if (filters?.verified !== undefined) {
      query = query.where('verified', '==', filters.verified);
    }

    if (filters?.active !== undefined) {
      query = query.where('active', '==', filters.active);
    }

    if (filters?.email) {
      query = query.where('developerEmail', '==', filters.email);
    }

    const snapshot = await query.get();
    const clients: OAuthClient[] = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      if (data) {
        // Don't include clientSecret
        delete data.clientSecret;
        clients.push({
          clientId: doc.id,
          ...data,
        } as OAuthClient);
      }
    });

    return clients;
  } catch (error) {
    console.error('Error listing OAuth clients:', error);
    return [];
  }
}

/**
 * Count OAuth clients by status
 */
export async function getOAuthClientStats(): Promise<{
  total: number;
  verified: number;
  unverified: number;
  active: number;
  inactive: number;
}> {
  try {
    const allClients = await firestoreDb.collection('oauth_clients').get();
    const clients = allClients.docs.map(doc => doc.data());

    return {
      total: clients.length,
      verified: clients.filter(c => c.verified).length,
      unverified: clients.filter(c => !c.verified).length,
      active: clients.filter(c => c.active).length,
      inactive: clients.filter(c => !c.active).length,
    };
  } catch (error) {
    console.error('Error getting OAuth client stats:', error);
    return { total: 0, verified: 0, unverified: 0, active: 0, inactive: 0 };
  }
}

/**
 * Get pending OAuth clients awaiting verification
 */
export async function getPendingOAuthClients(): Promise<OAuthClient[]> {
  return listOAuthClients({ verified: false });
}

/**
 * Approve (verify) an OAuth client
 */
export async function approveOAuthClient(clientId: string, userId: string): Promise<boolean> {
  try {
    const doc = await firestoreDb.collection('oauth_clients').doc(clientId).get();
    if (!doc.exists) return false;

    await firestoreDb
      .collection('oauth_clients')
      .doc(clientId)
      .update({
        verified: true,
        verificationDate: new Date(),
        updatedBy: userId,
        updatedAt: new Date(),
      });

    return true;
  } catch (error) {
    console.error('Error approving OAuth client:', error);
    return false;
  }
}

/**
 * Reject an OAuth client (delete it)
 */
export async function rejectOAuthClient(clientId: string): Promise<boolean> {
  try {
    const doc = await firestoreDb.collection('oauth_clients').doc(clientId).get();
    if (!doc.exists) return false;

    await firestoreDb.collection('oauth_clients').doc(clientId).delete();

    return true;
  } catch (error) {
    console.error('Error rejecting OAuth client:', error);
    return false;
  }
}

/**
 * Deactivate an OAuth client
 */
export async function deactivateOAuthClient(clientId: string, userId: string): Promise<boolean> {
  try {
    const doc = await firestoreDb.collection('oauth_clients').doc(clientId).get();
    if (!doc.exists) return false;

    await firestoreDb
      .collection('oauth_clients')
      .doc(clientId)
      .update({
        active: false,
        updatedBy: userId,
        updatedAt: new Date(),
      });

    return true;
  } catch (error) {
    console.error('Error deactivating OAuth client:', error);
    return false;
  }
}

/**
 * Reactivate an OAuth client
 */
export async function reactivateOAuthClient(clientId: string, userId: string): Promise<boolean> {
  try {
    const doc = await firestoreDb.collection('oauth_clients').doc(clientId).get();
    if (!doc.exists) return false;

    await firestoreDb
      .collection('oauth_clients')
      .doc(clientId)
      .update({
        active: true,
        updatedBy: userId,
        updatedAt: new Date(),
      });

    return true;
  } catch (error) {
    console.error('Error reactivating OAuth client:', error);
    return false;
  }
}

/**
 * Update OAuth client rate limits
 */
export async function updateOAuthClientRateLimit(
  clientId: string,
  tokensPerHour: number,
  requestsPerMinute: number,
  userId: string
): Promise<boolean> {
  try {
    const doc = await firestoreDb.collection('oauth_clients').doc(clientId).get();
    if (!doc.exists) return false;

    await firestoreDb
      .collection('oauth_clients')
      .doc(clientId)
      .update({
        rateLimit: {
          tokensPerHour,
          requestsPerMinute,
        },
        updatedBy: userId,
        updatedAt: new Date(),
      });

    return true;
  } catch (error) {
    console.error('Error updating rate limit:', error);
    return false;
  }
}

/**
 * Get all clients with token count (analytics)
 */
export async function getClientTokenStats(): Promise<
  Array<{
    clientId: string;
    appName: string;
    activeTokens: number;
    totalTokensIssued: number;
  }>
> {
  try {
    const clientsSnapshot = await firestoreDb.collection('oauth_clients').get();
    const clientStats = [];

    for (const clientDoc of clientsSnapshot.docs) {
      const clientData = clientDoc.data();
      const clientId = clientDoc.id;

      // Count tokens for this client
      const tokensSnapshot = await firestoreDb
        .collection('oauth_tokens')
        .where('clientId', '==', clientId)
        .get();

      let activeTokens = 0;
      let totalTokens = 0;

      tokensSnapshot.forEach(doc => {
        const tokenData = doc.data();
        totalTokens++;
        if (!tokenData.isRevoked && new Date(tokenData.expiresAt.toDate()) > new Date()) {
          activeTokens++;
        }
      });

      clientStats.push({
        clientId,
        appName: clientData.appName || 'Unknown',
        activeTokens,
        totalTokensIssued: totalTokens,
      });
    }

    return clientStats;
  } catch (error) {
    console.error('Error getting client token stats:', error);
    return [];
  }
}

/**
 * Export client data for audit purposes
 */
export async function exportClientData(clientId: string): Promise<string | null> {
  try {
    const client = await getOAuthClient(clientId);
    if (!client) return null;

    // Get all tokens for this client
    const tokensSnapshot = await firestoreDb
      .collection('oauth_tokens')
      .where('clientId', '==', clientId)
      .get();

    const tokens = tokensSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Get all audit logs for this client
    const logsSnapshot = await firestoreDb
      .collection('oauth_audit_logs')
      .where('clientId', '==', clientId)
      .orderBy('timestamp', 'desc')
      .limit(1000)
      .get();

    const logs = logsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    const exportData = {
      client,
      tokens,
      logs,
      exportedAt: new Date().toISOString(),
    };

    return JSON.stringify(exportData, null, 2);
  } catch (error) {
    console.error('Error exporting client data:', error);
    return null;
  }
}
