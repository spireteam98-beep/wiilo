import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const hasKey = Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    const hasFile = Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_KEY_FILE);
    const hasSplit = Boolean(process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY);

    let initMethod = 'none';
    if (hasKey) initMethod = 'service_account_key';
    else if (hasFile) initMethod = 'service_account_key_file';
    else if (hasSplit) initMethod = 'split_env';
    else initMethod = 'default_credentials';

    const projectId = process.env.FIREBASE_PROJECT_ID || null;
    const maskedProjectId = projectId
      ? (projectId.length > 10 ? `${projectId.slice(0, 6)}...${projectId.slice(-4)}` : projectId)
      : null;

    return NextResponse.json({ initMethod, projectId: maskedProjectId });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
