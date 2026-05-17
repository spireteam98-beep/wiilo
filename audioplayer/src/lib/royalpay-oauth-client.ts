/**
 * RoyalPay OAuth Client Library
 * 
 * For third-party apps to integrate RoyalPay authentication
 * 
 * Usage:
 * ```typescript
 * const client = new RoyalPayOAuthClient({
 *   clientId: 'your-client-id',
 *   clientSecret: 'your-client-secret',
 *   redirectUri: 'https://yourapp.com/callback',
 * });
 * 
 * // Get authorization URL
 * const url = client.getAuthorizationUrl({
 *   scope: ['profile', 'email', 'wallet'],
 * });
 * window.location.href = url;
 * 
 * // In callback, exchange code for token
 * const token = await client.exchangeCodeForToken(code);
 * 
 * // Get user info
 * const user = await client.getUserInfo(token.accessToken);
 * ```
 */

export interface RoyalPayOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  baseUrl?: string;
}

export interface RoyalPayUser {
  id: string;
  name: string;
  email: string;
  picture?: string;
  email_verified: boolean;
  wallet_id: string;
  royal_pay_id: string;
  country: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
}

export class RoyalPayOAuthClient {
  private config: Required<RoyalPayOAuthConfig>;
  private baseUrl: string;

  constructor(config: RoyalPayOAuthConfig) {
    this.config = {
      ...config,
      baseUrl: config.baseUrl || 'https://royalpay.app',
    };
    this.baseUrl = this.config.baseUrl;
  }

  /**
   * Get the authorization URL to redirect user to
   */
  getAuthorizationUrl(options: {
    scope?: string[];
    state?: string;
    appName?: string;
    appIcon?: string;
  } = {}): string {
    const state = options.state || this.generateState();
    const scope = options.scope?.join(' ') || 'profile email wallet';

    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      scope: scope,
      state: state,
    });

    if (options.appName) {
      params.append('app_name', options.appName);
    }

    if (options.appIcon) {
      params.append('app_icon', options.appIcon);
    }

    return `${this.baseUrl}/oauth/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string): Promise<TokenResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/oauth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          grant_type: 'authorization_code',
          code: code,
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          redirect_uri: this.config.redirectUri,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Token exchange failed: ${error.error}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(
        `Failed to exchange code for token: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  /**
   * Get user information using access token
   */
  async getUserInfo(accessToken: string): Promise<RoyalPayUser> {
    try {
      const response = await fetch(`${this.baseUrl}/api/oauth/userinfo`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized: Invalid or expired access token');
        }
        throw new Error('Failed to fetch user info');
      }

      return await response.json();
    } catch (error) {
      throw new Error(
        `Failed to get user info: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  /**
   * Parse the callback URL and extract code and state
   */
  parseCallback(callbackUrl: string): { code: string; state: string; error?: string } {
    const url = new URL(callbackUrl);

    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    if (error) {
      throw new Error(`OAuth error: ${error}`);
    }

    if (!code || !state) {
      throw new Error('Missing code or state in callback');
    }

    return { code, state };
  }

  /**
   * Validate state parameter matches
   */
  validateState(receivedState: string, originalState: string): boolean {
    return receivedState === originalState;
  }

  /**
   * Generate a random state parameter
   */
  private generateState(length = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Get user data from URL params (after callback)
   */
  parseUserDataFromParams(params: URLSearchParams): RoyalPayUser | null {
    const userData = params.get('user_data');
    if (!userData) return null;

    try {
      return JSON.parse(userData);
    } catch {
      return null;
    }
  }
}

/**
 * Helper function to quickly initialize OAuth client
 */
export function createRoyalPayOAuthClient(
  clientId: string,
  clientSecret: string,
  redirectUri: string
): RoyalPayOAuthClient {
  return new RoyalPayOAuthClient({
    clientId,
    clientSecret,
    redirectUri,
  });
}
