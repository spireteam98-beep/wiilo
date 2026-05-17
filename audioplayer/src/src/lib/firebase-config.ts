// Lightweight compatibility bridge for existing imports at '@/lib/firebase-config'
// This module re-exports the `auth` instance from the project's Firebase SDK
// so files that imported '@/lib/firebase-config' continue to work.

import { getSdks } from '@/firebase';

const { auth } = getSdks();

export { auth };

export default { auth };
