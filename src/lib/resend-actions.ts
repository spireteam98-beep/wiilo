
'use server';

import { Resend } from 'resend';
import { getAdminAuth } from './firebase-admin';

/**
 * Sends a custom verification email via Resend with a manually generated Firebase link.
 * Includes a robust retry mechanism to handle replication lag after user creation.
 * Returns a result object to avoid Next.js "digest" errors on the client.
 */
export async function sendCustomVerificationEmail(email: string, name: string): Promise<{ success: boolean; message: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('[ResendAction] RESEND_API_KEY is not set.');
    return { success: false, message: 'Email service configuration missing.' };
  }

  const resend = new Resend(apiKey);
  let adminAuth;
  
  try {
    adminAuth = getAdminAuth();
  } catch (e: any) {
    console.error('[ResendAction] Admin Auth init failed:', e.message);
    return { success: false, message: 'Backend service initialization failed.' };
  }

  // Configuration for the verification link
  const actionCodeSettings = {
    url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002'}/dashboard`,
    handleCodeInApp: false,
  };

  let verificationLink = '';
  let retries = 12; // Increased retries
  let delay = 1500; // Base delay

  console.log(`[ResendAction] Generating verification link for: ${email}`);

  while (retries > 0) {
    try {
      verificationLink = await adminAuth.generateEmailVerificationLink(email, actionCodeSettings);
      console.log(`[ResendAction] Success for ${email} on attempt ${13 - retries}`);
      break; 
    } catch (error: any) {
      const isUserNotFound = error.code === 'auth/user-not-found' || 
                             error.message?.toLowerCase().includes('no user record');
      
      if (isUserNotFound && retries > 1) {
        console.log(`[ResendAction] User ${email} not found yet. Retrying in ${delay}ms... (${retries - 1} left)`);
        await new Promise(resolve => setTimeout(resolve, delay));
        retries--;
        delay += 500; // Linear backoff
      } else {
        console.error('[ResendAction] Error generating verification link:', error.message);
        return { success: false, message: `Verification failed: ${error.message}` };
      }
    }
  }

  if (!verificationLink) {
    return { success: false, message: 'User record synchronization timed out.' };
  }

  try {
    const result = await resend.emails.send({
      from: 'Wiillo <onboarding@wiillo.com>',
      to: email,
      subject: 'Verify your Wiillo account',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; border: 1px solid #f0f0f0; border-radius: 24px; background-color: #ffffff;">
          <h1 style="color: #7c3aed; font-size: 24px; font-weight: 800; margin-bottom: 24px;">Welcome to Wiillo, ${name}!</h1>
          <p style="font-size: 16px; color: #4b5563; line-height: 1.6; margin-bottom: 32px;">
            We're excited to help you manage your business. To protect your data and activate your workspace, please verify your email address by clicking the button below:
          </p>
          <div style="text-align: center; margin-bottom: 32px;">
            <a href="${verificationLink}" style="background: linear-gradient(135deg, #ff2d7a, #7c3aed); color: #ffffff; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 800; display: inline-block;">
              Verify Email Address
            </a>
          </div>
          <p style="font-size: 14px; color: #9ca3af; margin-bottom: 8px;">If the button above doesn't work, copy and paste this link into your browser:</p>
          <p style="font-size: 12px; color: #7c3aed; word-break: break-all; margin-bottom: 32px;">${verificationLink}</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 32px 0;" />
          <p style="font-size: 12px; color: #9ca3af;">If you didn't create an account with Wiillo, you can safely ignore this email.</p>
        </div>
      `,
    });

    if (result.error) {
      console.error('[ResendAction] Resend API error:', result.error);
      return { success: false, message: 'Email provider error.' };
    }
    
    return { success: true, message: 'Verification email sent successfully.' };
  } catch (error: any) {
    console.error('[ResendAction] SMTP Error:', error.message);
    return { success: false, message: 'Mail server unreachable.' };
  }
}
