"use client";

import React from 'react';

export default function VerifyShortcodePage() {
  return (
    <div>
      {/* Verify shortcode page content coming soon */}
    </div>
  );
}

/* Original code commented out for future use
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function VerifyShortcodePage() {
  const [shortcode, setShortcode] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('/api/verify-shortcode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ shortcode }),
      });

      if (!response.ok) {
        setMessage('Unexpected response from server. Please try again later.'); 
      } else {
        const data = await response.json();
        if (data.success) {
          router.push('/dashboard');
        } else {
          setMessage(data.message || 'Invalid verification code');
        }
      }
    } catch (error) {
      setMessage('An error occurred during verification');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Enter Verification Code</h1>
      <form onSubmit={handleVerification}>
        <input
          type="text"
          value={shortcode}
          onChange={(e) => setShortcode(e.target.value)}
          placeholder="Enter verification code"
          disabled={loading}
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Verifying...' : 'Verify'}
        </button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}
*/
