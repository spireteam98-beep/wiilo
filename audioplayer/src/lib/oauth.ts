/**
 * RoyalPay OAuth 2.0 Provider
 * Allows third-party apps to authenticate users via RoyalPay
 */

export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope?: string[];
  appName: string;
  appIcon?: string;
}

export interface OAuthRequest {
  clientId: string;
  redirectUri: string;
  scope: string[];
  state: string;
  responseType: 'code' | 'token';
  appName: string;
  appIcon?: string;
}

export interface OAuthCode {
  code: string;
  clientId: string;
  userId: string;
  expiresAt: number;
  redirectUri: string;
  scope: string[];
  createdAt: number;
}

export interface OAuthToken {
  accessToken: string;
  refreshToken?: string;
  tokenType: 'Bearer';
  expiresIn: number;
  scope: string[];
  createdAt: number;
}

export interface OAuthUserData {
  id: string;
  name: string;
  email: string;
  profileImage?: string;
  walletId: string;
  royalPayId: string;
  country: string;
  verified: boolean;
}

export interface OAuthSession {
  requestId: string;
  clientId: string;
  userId?: string;
  scope: string[];
  appName: string;
  appIcon?: string;
  redirectUri: string;
  state: string;
  status: 'pending' | 'authorized' | 'denied' | 'expired';
  createdAt: number;
  expiresAt: number;
  pinVerified?: boolean;
}

/**
 * Generate OAuth authorization code
 */
export function generateAuthorizationCode(length = 32): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(length)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .substring(0, length);
}

/**
 * Generate OAuth state parameter
 */
export function generateState(length = 32): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(length)))
    .map(b => ((b % 36) < 10 ? (b % 10) : String.fromCharCode(97 + (b % 26))))
    .join('')
    .substring(0, length);
}

/**
 * Create OAuth authorization URL
 */
export function createAuthorizationUrl(
  baseUrl: string,
  config: {
    clientId: string;
    redirectUri: string;
    scope?: string[];
    state?: string;
    appName?: string;
  }
): string {
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: config.scope?.join(' ') || 'profile email wallet',
    state: config.state || generateState(),
  });

  if (config.appName) {
    params.append('app_name', config.appName);
  }

  return `${baseUrl}/oauth/authorize?${params.toString()}`;
}

/**
 * Parse authorization code from redirect URI
 */
export function parseAuthorizationResponse(url: string): {
  code?: string;
  error?: string;
  state?: string;
} {
  const urlObj = new URL(url);
  return {
    code: urlObj.searchParams.get('code') || undefined,
    error: urlObj.searchParams.get('error') || undefined,
    state: urlObj.searchParams.get('state') || undefined,
  };
}

/**
 * Validate OAuth request
 */
export function validateOAuthRequest(request: Partial<OAuthRequest>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!request.clientId) {
    errors.push('Missing clientId');
  }

  if (!request.redirectUri) {
    errors.push('Missing redirectUri');
  }

  if (!request.state) {
    errors.push('Missing state parameter');
  }

  if (!request.responseType) {
    errors.push('Missing responseType');
  }

  if (request.responseType && !['code', 'token'].includes(request.responseType)) {
    errors.push('Invalid responseType. Must be "code" or "token"');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate redirect URI
 */
export function isValidRedirectUri(
  clientRedirectUri: string,
  registeredUris: string[]
): boolean {
  // Exact match or wildcard match
  return registeredUris.some(uri => {
    if (uri === clientRedirectUri) return true;
    // Allow subdomain wildcards
    if (uri.startsWith('*.')) {
      const domain = uri.substring(2);
      return clientRedirectUri.endsWith('.' + domain) || clientRedirectUri.endsWith(domain);
    }
    return false;
  });
}

/**
 * Calculate token expiration
 */
export function getTokenExpiration(durationInSeconds = 3600): number {
  return Date.now() + durationInSeconds * 1000;
}

/**
 * Check if token is expired
 */
export function isTokenExpired(expiresAt: number): boolean {
  return Date.now() > expiresAt;
}

/**
 * Get scope description for UI
 */
export function getScopeDescription(scope: string): string {
  const descriptions: Record<string, string> = {
    profile: 'Access your profile information',
    email: 'Access your email address',
    wallet: 'Access your wallet ID and account details',
    transactions: 'View your transaction history',
    balance: 'View your wallet balance',
  };
  return descriptions[scope] || scope;
}

/**
 * Filter user data based on requested scope
 */
export function filterUserDataByScope(
  userData: OAuthUserData,
  scope: string[]
): Partial<OAuthUserData> {
  const filtered: Partial<OAuthUserData> = {};

  if (scope.includes('profile')) {
    filtered.name = userData.name;
    filtered.profileImage = userData.profileImage;
    filtered.country = userData.country;
  }

  if (scope.includes('email')) {
    filtered.email = userData.email;
  }

  if (scope.includes('wallet')) {
    filtered.walletId = userData.walletId;
    filtered.royalPayId = userData.royalPayId;
    filtered.id = userData.id;
  }

  // Always include ID for identification
  if (!filtered.id) {
    filtered.id = userData.id;
  }

  return filtered;
}
