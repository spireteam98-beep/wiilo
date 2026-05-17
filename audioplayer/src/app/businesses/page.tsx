"use client";

import { useFirebaseAuth } from '@/contexts/firebase-auth';
import { listBusinesses } from '@/lib/business';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function BusinessesIndex() {
  const { user } = useFirebaseAuth();
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!user) return setLoading(false);
      setLoading(true);
      try {
        const bs = await listBusinesses(user);
        setBusinesses(bs);
      } catch (e) {
        console.error('Failed to list businesses', e);
      } finally { setLoading(false); }
    })();
  }, [user]);

  if (!user) return <div className="p-6 text-white">Please sign in to view your businesses.</div>;
  if (loading) return <div className="p-6 text-white">Loading...</div>;
  if (!businesses.length) return <div className="p-6 text-white">You have no businesses yet.</div>;

  return (
    <div className="p-6 text-white">
      <h1 className="text-2xl font-bold mb-4">Your Businesses</h1>
      <ul>
        {businesses.map(b => (
          <li key={b.id} className="p-3 rounded border border-white/5 mb-2">
            <Link href={`/businesses/${b.id}`}>{b.name}</Link>
            <div className="text-sm text-white/60">Owner: {b.ownerUid}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
