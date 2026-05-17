// firebase/use-memo-firebase.ts
'use client';
import { useMemo, DependencyList } from 'react';
import { CollectionReference, DocumentReference, Query, DocumentData } from 'firebase/firestore';

type Memoizable = CollectionReference | DocumentReference | Query;

// This is a wrapper around useMemo that adds a `.__memo = true` property
// to the returned value. This is used by the useCollection and useDoc hooks
// to ensure that the query/reference has been memoized.
export function useMemoFirebase<T extends Memoizable | null | undefined>(
  factory: () => T,
  deps: DependencyList | undefined
): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memoized = useMemo(factory, deps);
  if (memoized) {
    (memoized as DocumentData).__memo = true;
  }
  return memoized;
}
