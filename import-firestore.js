/**
 * Firestore Import Tool
 * This script imports the data exported by export-firestore.js into your brand new target Firebase project.
 * It preserves all custom documents IDs and recreates nested sub-collections (e.g. weight_history, activity_logs) exactly.
 * 
 * SETUP INSTRUCTIONS:
 * 1. Download node modules: npm install firebase-admin @google-cloud/firestore
 * 2. Download your NEW/TARGET Google Cloud service account private key (JSON) from your new Firebase control panel:
 *    Firebase Console -> Project Settings -> Service Accounts -> Generate New Private Key
 * 3. Save it as "service-account-target.json" in this directory.
 * 4. Ensure "firestore-backup.json" created by the export tool is also in this directory.
 * 5. Run: node import-firestore.js
 */

const admin = require('firebase-admin');
const { Firestore } = require('@google-cloud/firestore');
const fs = require('fs');
const path = require('path');

// Configure files
const TARGET_ACCOUNT_KEY = path.join(__dirname, 'service-account-target.json');
const BACKUP_FILE = path.join(__dirname, 'firestore-backup.json');

// --- NEW DATABASE ID SELECTION ---
// Usually, brand new Firestore databases use '(default)'.
// If you created a custom database named differently in your target project, put its ID here.
const TARGET_DATABASE_ID = "(default)";
const TARGET_PROJECT_ID = "geckofarm-pro";

if (!fs.existsSync(TARGET_ACCOUNT_KEY)) {
  console.log('========================================================================');
  console.log('⚠️  ERROR: service-account-target.json NOT found!');
  console.log('Please:');
  console.log('1. Go to your NEW/TARGET Firebase Console -> Project Settings -> Service Accounts');
  console.log('2. Click "Generate New Private Key" to download the key.');
  console.log('3. Save it as "service-account-target.json" in this directory.');
  console.log('========================================================================');
  process.exit(1);
}

if (!fs.existsSync(BACKUP_FILE)) {
  console.log('========================================================================');
  console.log('⚠️  ERROR: firestore-backup.json backing file was NOT found in this folder!');
  console.log('Please run node export-firestore.js first on your source project to generate the backup.');
  console.log('========================================================================');
  process.exit(1);
}

const serviceAccountTarget = require(TARGET_ACCOUNT_KEY);

console.log('====================================================');
console.log('📥 LIZARD NEST - FIRESTORE BULK IMPORT ENGINE');
console.log('====================================================');
console.log(`Target Project  : ${TARGET_PROJECT_ID}`);
console.log(`Target Database : ${TARGET_DATABASE_ID}`);
console.log('====================================================');

// Initialize database instance using direct client connection
let db;
try {
  console.log('📡 Connecting directly to TARGET Firestore using @google-cloud/firestore Native Client...');
  db = new Firestore({
    projectId: TARGET_PROJECT_ID,
    databaseId: TARGET_DATABASE_ID,
    credentials: {
      client_email: serviceAccountTarget.client_email,
      private_key: serviceAccountTarget.private_key,
    }
  });
  console.log('✅ Connection established via @google-cloud/firestore (Multi-database native support)');
} catch (error) {
  console.log('⚠️ Native Firestore Client failed to init. Trying firebase-admin fallback...');
  try {
    const targetApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccountTarget)
    }, 'target_project_app');

    if (TARGET_DATABASE_ID && TARGET_DATABASE_ID !== '(default)') {
      const { getFirestore } = require('firebase-admin/firestore');
      db = getFirestore(targetApp, TARGET_DATABASE_ID);
      console.log(`✅ Connection established via modular firebase-admin/firestore`);
    } else {
      db = admin.firestore(targetApp);
      console.log(`✅ Connection established via default firebase-admin`);
    }
  } catch (adminErr) {
    console.error('⛔ Device Connection Error: Failed all connection strategies!', adminErr);
    process.exit(1);
  }
}

// Read the exported file
const backupData = JSON.parse(fs.readFileSync(BACKUP_FILE, 'utf-8'));

/**
 * Recursively writes documents and sub-collections to Firestore
 */
async function importCollection(collectionRef, rootData) {
  const documents = rootData.documents || {};
  const docIds = Object.keys(documents);
  let count = 0;

  for (const docId of docIds) {
    const docWrapper = documents[docId];
    const data = docWrapper._data;
    const subCollections = docWrapper._subCollections || {};

    const docRef = collectionRef.doc(docId);
    
    // Write the main document data
    await docRef.set(data);
    count++;

    // Progress updates to keep user informed and terminal session alive
    if (collectionRef.path.split('/').length === 1 && count % 10 === 0) {
      console.log(`   🔸 Uploaded ${count} of ${docIds.length} documents in top-level collection...`);
    }

    // Recursively write nested sub-collections (e.g. weight_history, activity_logs)
    const subColIds = Object.keys(subCollections);
    for (const subColId of subColIds) {
      const subColRef = docRef.collection(subColId);
      await importCollection(subColRef, subCollections[subColId]);
    }
  }
}

async function runImporter() {
  try {
    const rootCollectionKeys = Object.keys(backupData);
    console.log(`✨ Backup file loaded! Found ${rootCollectionKeys.length} collections to upload: [${rootCollectionKeys.join(', ')}]`);
    console.log('⚙️ Writing everything to your new Firestore... Please do not terminate this script.');

    for (const key of rootCollectionKeys) {
      console.log(`📂 Importing root-collection: "${key}"...`);
      const collectionRef = db.collection(key);
      await importCollection(collectionRef, backupData[key]);
      console.log(`✅ Root-collection: "${key}" successfully imported!`);
    }

    console.log('\n====================================================');
    console.log('🌟 SUCCESS! ALL FIRESTORE DATA SUCCESSFULLY TRANSFERRED! 🎉');
    console.log(`Top level collections migrated: ${rootCollectionKeys.length}`);
    console.log('====================================================');
  } catch (error) {
    console.error('⛔ Critical Import Error:', error);
  }
}

runImporter();
