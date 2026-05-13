import { firestoreDb } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { NextRequest, NextResponse } from 'next/server';

/**
 * OAuth Statistics & Analytics
 * GET /api/admin/oauth/stats
 * 
 * Returns comprehensive OAuth system statistics
 */
export async function GET(req: NextRequest) {
  try {
    // Verify admin authentication
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'unauthorized', message: 'Missing authentication' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    try {
      const auth = getAuth();
      await auth.verifyIdToken(token);
    } catch (error) {
      return NextResponse.json(
        { error: 'unauthorized', message: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    // Get client statistics
    const clientsSnapshot = await firestoreDb.collection('oauth_clients').get();
    const totalClients = clientsSnapshot.size;
    let verifiedClients = 0;
    let activeClients = 0;

    clientsSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.verified) verifiedClients++;
      if (data.active) activeClients++;
    });

    // Get tokens statistics
    const tokensSnapshot = await firestoreDb.collection('oauth_tokens').get();
    const totalTokensIssued = tokensSnapshot.size;
    let activeTokens = 0;
    let revokedTokens = 0;

    tokensSnapshot.forEach(doc => {
      const data = doc.data();
      const expiresAt = data.expiresAt?.toDate?.() || new Date(data.expiresAt);
      if (data.isRevoked) {
        revokedTokens++;
      } else if (expiresAt > new Date()) {
        activeTokens++;
      }
    });

    // Get authorization codes statistics
    const codesSnapshot = await firestoreDb.collection('oauth_codes').get();
    const totalCodesGenerated = codesSnapshot.size;
    let usedCodes = 0;
    let pendingCodes = 0;

    codesSnapshot.forEach(doc => {
      const data = doc.data();
      const expiresAt = data.expiresAt?.toDate?.() || new Date(data.expiresAt);
      if (data.isUsed) {
        usedCodes++;
      } else if (expiresAt > new Date()) {
        pendingCodes++;
      }
    });

    // Get audit logs statistics (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const auditLogsSnapshot = await firestoreDb
      .collection('oauth_audit_logs')
      .where('timestamp', '>=', sevenDaysAgo)
      .get();

    const auditStats = {
      totalEvents: auditLogsSnapshot.size,
      successfulAuths: 0,
      failedAuths: 0,
      tokensIssued: 0,
      errorsRaised: 0,
      eventsByType: {} as Record<string, number>,
    };

    auditLogsSnapshot.forEach(doc => {
      const data = doc.data();
      const eventType = data.eventType || 'unknown';
      const status = data.status || 'unknown';

      auditStats.eventsByType[eventType] = (auditStats.eventsByType[eventType] || 0) + 1;

      if (eventType === 'auth_approved' && status === 'success') {
        auditStats.successfulAuths++;
      } else if (eventType === 'auth_approved' && status === 'failure') {
        auditStats.failedAuths++;
      } else if (eventType === 'token_issued' && status === 'success') {
        auditStats.tokensIssued++;
      } else if (eventType === 'error') {
        auditStats.errorsRaised++;
      }
    });

    // Get top clients by usage
    const clientUsage: Record<string, number> = {};
    auditLogsSnapshot.forEach(doc => {
      const data = doc.data();
      const clientId = data.clientId || 'unknown';
      clientUsage[clientId] = (clientUsage[clientId] || 0) + 1;
    });

    const topClientsRaw = Object.entries(clientUsage)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);

    const topClients = [];
    for (const [clientId, count] of topClientsRaw) {
      const clientDoc = await firestoreDb.collection('oauth_clients').doc(clientId).get();
      topClients.push({
        clientId,
        appName: clientDoc.data()?.appName || 'Unknown',
        eventCount: count,
      });
    }

    // Get hourly distribution (last 24 hours)
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const hourlySnapshot = await firestoreDb
      .collection('oauth_audit_logs')
      .where('timestamp', '>=', oneDayAgo)
      .get();

    const hourlyDistribution: Record<number, number> = {};
    hourlySnapshot.forEach(doc => {
      const data = doc.data();
      const timestamp = data.timestamp?.toDate?.() || new Date(data.timestamp);
      const hour = timestamp.getHours();
      hourlyDistribution[hour] = (hourlyDistribution[hour] || 0) + 1;
    });

    return NextResponse.json({
      clients: {
        total: totalClients,
        verified: verifiedClients,
        unverified: totalClients - verifiedClients,
        active: activeClients,
        inactive: totalClients - activeClients,
        topClients,
      },
      tokens: {
        total: totalTokensIssued,
        active: activeTokens,
        revoked: revokedTokens,
        expired: totalTokensIssued - activeTokens - revokedTokens,
      },
      authorizationCodes: {
        total: totalCodesGenerated,
        used: usedCodes,
        pending: pendingCodes,
        expired: totalCodesGenerated - usedCodes - pendingCodes,
      },
      auditLogs: {
        ...auditStats,
        period: '7 days',
      },
      hourlyDistribution,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching OAuth stats:', error);
    return NextResponse.json(
      { error: 'server_error', message: 'Failed to fetch OAuth statistics' },
      { status: 500 }
    );
  }
}
