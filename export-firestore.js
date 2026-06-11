/**
 * Firestore Export Tool
 * This script exports all Firestore collections and deep sub-collections (e.g. geckos -> weight_history) 
 * using both Google Cloud Firestore Native SDK and Firebase Admin SDK.
 * 
 * SETUP INSTRUCTIONS:
 * 1. Download node modules: npm install firebase-admin @google-cloud/firestore
 * 2. Download your Google Cloud service account private key (JSON) from the Firebase Console:
 *    Firebase Console -> Project Settings -> Service Accounts -> Generate New Private Key
 * 3. Place that JSON file in the same folder as this script and name it: service-account-source.json
 * 4. Run: node export-firestore.js
 */

const admin = require('firebase-admin');
const { Firestore } = require('@google-cloud/firestore');
const fs = require('fs');
const path = require('path');

// Configure files
const SOURCE_ACCOUNT_KEY = path.join(__dirname, 'service-account-source.json');
const EXPORT_DEST_FILE = path.join(__dirname, 'firestore-backup.json');

// --- DATABASE ID SELECTION ---
// AI Studio default project uses a custom firestore database ID (e.g. "ai-studio-c37de128-66ef-4b94-b973-3bcd1099a28c")
const SOURCE_DATABASE_ID = "ai-studio-c37de128-66ef-4b94-b973-3bcd1099a28c";
const SOURCE_PROJECT_ID = "gen-lang-client-0198477376";

// Explicit list of collections requested by the user as a fallback if listing fails due to permissions
const REQUESTED_COLLECTIONS = ['users', 'geckos', 'pairings', 'clutches', 'morphs', 'morph_relations'];

if (!fs.existsSync(SOURCE_ACCOUNT_KEY)) {
  console.log('========================================================================');
  console.log('⚠️  ERROR: service-account-source.json NOT found!');
  console.log('Please:');
  console.log('1. Go to Firebase Console -> Project Settings -> Service Accounts');
  console.log('2. Click "Generate New Private Key" to download the JSON credential file.');
  console.log('3. Save it as "service-account-source.json" in this directory.');
  console.log('========================================================================');
  process.exit(1);
}

const serviceAccount = require(SOURCE_ACCOUNT_KEY);

console.log('====================================================');
console.log('LIZARD NEST - FIRESTORE AUDIT & EXPORT ENGINE');
console.log('====================================================');
console.log(`Source Project  : ${SOURCE_PROJECT_ID}`);
console.log(`Target Database : ${SOURCE_DATABASE_ID}`);
console.log('====================================================');

// Get the specific database instance via the most robust method
let db;
try {
  console.log('📡 Connecting directly to Firestore using @google-cloud/firestore Native Client...');
  // Direct Native instantiation bypasses firebase-admin version limitations or global state errors
  db = new Firestore({
    projectId: SOURCE_PROJECT_ID,
    databaseId: SOURCE_DATABASE_ID,
    credentials: {
      client_email: serviceAccount.client_email,
      private_key: serviceAccount.private_key,
    }
  });
  console.log('✅ Connection established via @google-cloud/firestore (Multi-database native support)');
} catch (error) {
  console.log('⚠️ Native Firestore Client failed to init. Trying firebase-admin fallback...');
  try {
    const sourceApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    }, 'source_project_app');

    // Attempting modern firebase-admin multi-database method
    if (SOURCE_DATABASE_ID && SOURCE_DATABASE_ID !== '(default)') {
      const { getFirestore } = require('firebase-admin/firestore');
      db = getFirestore(sourceApp, SOURCE_DATABASE_ID);
      console.log(`✅ Connection established via modular firebase-admin/firestore`);
    } else {
      db = admin.firestore(sourceApp);
      console.log(`✅ Connection established via default firebase-admin`);
    }
  } catch (adminErr) {
    console.error('⛔ Device Connection Error: Failed all connection strategies!', adminErr);
    process.exit(1);
  }
}

const backupData = {};

/**
 * Recursively exports documents and their nested sub-collections
 */
async function exportCollection(collectionRef) {
  const snapshot = await collectionRef.get();
  const docsData = {};

  if (snapshot.empty) {
    return { documents: {} };
  }

  for (const doc of snapshot.docs) {
    const docData = doc.data();
    
    // Save document data and metadata
    docsData[doc.id] = {
      _data: docData,
      _subCollections: {}
    };

    // Auto-discover deep nested sub-collections (like geckos/{id}/weight_history)
    try {
      const subCollections = await doc.ref.listCollections();
      for (const subCol of subCollections) {
        const subColBackup = await exportCollection(subCol);
        if (Object.keys(subColBackup.documents).length > 0) {
          docsData[doc.id]._subCollections[subCol.id] = subColBackup;
        }
      }
    } catch (subErr) {
      // In some configurations, listCollections permissions may be restricted. 
      // For geckos, check the known subcollections explicitly if listing fails.
      if (collectionRef.id === 'geckos') {
        const knownSubcollections = ['weight_history', 'activity_logs'];
        for (const knownSub of knownSubcollections) {
          const subColRef = doc.ref.collection(knownSub);
          const subSnap = await subColRef.get();
          if (!subSnap.empty) {
            const subColBackup = await exportCollection(subColRef);
            docsData[doc.id]._subCollections[knownSub] = subColBackup;
          }
        }
      }
    }
  }

  return {
    documents: docsData
  };
}

async function runExporter() {
  try {
    let collectionsToExport = [];
    
    // Attempt dynamic discovery of collections first
    try {
      console.log('🔍 Listing root level collections on source database...');
      const rootCollections = await db.listCollections();
      collectionsToExport = rootCollections.map(col => col.id);
      console.log(`ℹ️ Discovered collections: ${collectionsToExport.join(', ')}`);
    } catch (listErr) {
      console.log('⚠️ Notice: Could not list collections dynamically (IAM serviceAccount may lack list rights).');
      console.log('👉 Falling back to explicit user collection requirements list.');
      collectionsToExport = REQUESTED_COLLECTIONS;
    }

    if (collectionsToExport.length === 0) {
      collectionsToExport = REQUESTED_COLLECTIONS;
    }

    console.log(`🚀 Starting data export for collections: [${collectionsToExport.join(', ')}]`);

    for (const colName of collectionsToExport) {
      console.log(`📦 Exporting active collection: "${colName}"...`);
      try {
        const colRef = db.collection(colName);
        const colData = await exportCollection(colRef);
        
        const docCount = Object.keys(colData.documents).length;
        console.log(`   ✅ Succeeded: ${docCount} documents collected from "${colName}"`);
        
        if (docCount > 0) {
          backupData[colName] = colData;
        }
      } catch (colErr) {
        console.error(`   ❌ Failed to read collection "${colName}":`, colErr.message);
      }
    }

    console.log(`💾 Saving exported metadata to ${EXPORT_DEST_FILE}...`);
    fs.writeFileSync(EXPORT_DEST_FILE, JSON.stringify(backupData, null, 2), 'utf-8');
    
    console.log('\n====================================================');
    console.log('🎉 EXPORT MASTERPIECE CREATED!');
    console.log(`📁 Backup Location : ${EXPORT_DEST_FILE}`);
    console.log(`📏 File Size       : ${(fs.statSync(EXPORT_DEST_FILE).size / 1024).toFixed(2)} KB`);
    console.log(`🔑 Collections Saved: ${Object.keys(backupData).join(', ')}`);
    console.log('====================================================');
  } catch (error) {
    console.error('⛔ Critical Export Error:', error);
  }
}

runExporter();
