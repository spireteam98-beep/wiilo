#!/usr/bin/env node
/* Seed a sample news post into Firestore `news_posts` collection.
   Usage: node scripts/seed_news_post.js [DOC_ID]
*/
const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

async function initAdmin() {
  if (admin.apps && admin.apps.length) return admin;

  const fallbackPath = path.join(process.env.USERPROFILE || process.env.HOME || '.', '.config', 'wiilo', 'firebase-service-account.json');
  const serviceAccountFile = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_FILE || fallbackPath;

  if (!fs.existsSync(serviceAccountFile)) {
    console.error('Service account file not found at', serviceAccountFile);
    process.exit(1);
  }

  const raw = fs.readFileSync(serviceAccountFile, 'utf8');
  const serviceAccount = JSON.parse(raw);

  if (serviceAccount.private_key) {
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id || process.env.FIREBASE_PROJECT_ID,
  });

  return admin;
}

function makeSampleContent() {
  const title = 'Remember the force behind the thing.';
  const excerpt = 'Principle of the day — remember the force behind the thing.';
  const html = `
    <div>
      <p>The experiment showed <span class="inline-highlight">significant gains</span> across groups.</p>

      <blockquote>
        REMEMBER THE FORCE BEHIND THE THING.
      </blockquote>

      <h2>Subheading Example</h2>
      <p>Short supporting paragraph for the subheading.</p>
    </div>
  `;

  return {
    wpId: null,
    date: new Date().toISOString(),
    titleRendered: title,
    excerptRendered: excerpt,
    contentRendered: html,
    link: '',
    featuredImage: 'https://picsum.photos/seed/principle/1200/800',
    featuredImageAlt: 'Principle image',
    updatedAt: new Date().toISOString(),
  };
}

async function run() {
  const adminSdk = await initAdmin();
  const db = adminSdk.firestore();

  const docIdArg = process.argv[2];
  const docId = docIdArg || String(Date.now()).slice(4); // simple numeric-ish id

  const sample = makeSampleContent();
  // set wpId to numeric docId if parseable
  const maybeNum = parseInt(docId, 10);
  if (!isNaN(maybeNum)) sample.wpId = maybeNum;

  const ref = db.collection('news_posts').doc(String(docId));
  await ref.set(sample, { merge: true });
  console.log('Seeded news_posts doc id=', docId);
  console.log('Open http://localhost:3000/news/' + docId);
  process.exit(0);
}

run().catch((err) => {
  console.error('Error seeding post:', err);
  process.exit(1);
});
