import { firestoreDb } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Get OAuth Audit Logs
 * GET /api/admin/oauth/audit-logs
 * 
 * Query parameters:
 * - clientId: Filter by specific client
 * - userId: Filter by specific user
 * - eventType: Filter by event type (auth_started, auth_approved, token_issued, token_used, error)
 * - status: Filter by status (success, failure)
 * - limit: Number of logs to return (default: 100, max: 1000)
 * - startAfter: Pagination cursor
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

    // Parse query parameters
    const url = new URL(req.url);
    const clientId = url.searchParams.get('clientId');
    const userId = url.searchParams.get('userId');
    const eventType = url.searchParams.get('eventType');
    const status = url.searchParams.get('status');
    const limitParam = url.searchParams.get('limit');
    const startAfterParam = url.searchParams.get('startAfter');

    let limit = 100;
    if (limitParam) {
      const parsed = parseInt(limitParam);
      if (!isNaN(parsed) && parsed > 0 && parsed <= 1000) {
        limit = parsed;
      }
    }

    // Build query
    let query = firestoreDb
      .collection('oauth_audit_logs')
      .orderBy('timestamp', 'desc')
      .limit(limit + 1); // +1 to determine if there are more results

    if (clientId) {
      query = query.where('clientId', '==', clientId);
    }

    if (userId) {
      query = query.where('userId', '==', userId);
    }

    if (eventType) {
      query = query.where('eventType', '==', eventType);
    }

    if (status) {
      query = query.where('status', '==', status);
    }

    // Note: Firestore doesn't support pagination cursors well with where clauses
    // For production, consider using a more sophisticated pagination approach
    // or Firebase Realtime Database for audit logs

    const snapshot = await query.get();

    const logs: any[] = [];
    let hasMore = false;

    snapshot.forEach((doc, index) => {
      if (index < limit) {
        const data = doc.data();
        logs.push({
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate?.() || data.timestamp,
        });
      } else {
        hasMore = true;
      }
    });

    return NextResponse.json({
      logs,
      hasMore,
      limit,
      count: logs.length,
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json(
      { error: 'server_error', message: 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
}

/**
 * Export Audit Logs
 * POST /api/admin/oauth/audit-logs/export
 */
export async function POST(req: NextRequest) {
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

    const { clientId, userId, eventType, status, startDate, endDate } = await req.json();

    // Build query for export
    let query: any = firestoreDb.collection('oauth_audit_logs');

    if (clientId) {
      query = query.where('clientId', '==', clientId);
    }

    if (userId) {
      query = query.where('userId', '==', userId);
    }

    if (eventType) {
      query = query.where('eventType', '==', eventType);
    }

    if (status) {
      query = query.where('status', '==', status);
    }

    // Note: Date range filtering requires a composite index in Firestore
    // For now, we'll fetch and filter in application

    const snapshot = await query.orderBy('timestamp', 'desc').limit(10000).get();

    const logs: any[] = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      const timestamp = data.timestamp?.toDate?.() || data.timestamp;

      // Filter by date range if provided
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (timestamp < start || timestamp > end) {
          return;
        }
      }

      logs.push({
        id: doc.id,
        ...data,
        timestamp,
      });
    });

    // Generate CSV
    const headers = [
      'Timestamp',
      'Event Type',
      'Client ID',
      'User ID',
      'Status',
      'Error Code',
      'Error Message',
      'Scope',
      'IP Address',
    ];

    const rows = logs.map(log => [
      log.timestamp instanceof Date ? log.timestamp.toISOString() : log.timestamp,
      log.eventType || '',
      log.clientId || '',
      log.userId || '',
      log.status || '',
      log.errorCode || '',
      log.errorMessage || '',
      Array.isArray(log.scope) ? log.scope.join(',') : log.scope || '',
      log.ipAddress || '',
    ]);

    let csv = headers.join(',') + '\n';
    rows.forEach(row => {
      csv += row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',') + '\n';
    });

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="oauth-audit-logs.csv"',
      },
    });
  } catch (error) {
    console.error('Error exporting audit logs:', error);
    return NextResponse.json(
      { error: 'server_error', message: 'Failed to export audit logs' },
      { status: 500 }
    );
  }
}
