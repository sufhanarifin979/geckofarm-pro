import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc } from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';

// Load configuration directly from firebase-applet-config.json
const configPath = path.join(process.cwd(), 'firebase-applet-config.json');

if (!fs.existsSync(configPath)) {
  console.error("❌ Error: firebase-applet-config.json not found in the root directory!");
  process.exit(1);
}

const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

console.log("====================================================");
console.log("🦎 FIREBASE AI STUDIO DATA EXPORT ENGINE");
console.log("====================================================");
console.log(`Target Project   : ${firebaseConfig.projectId}`);
console.log(`Target Database  : ${firebaseConfig.firestoreDatabaseId}`);
console.log("====================================================");

async function exportFullDatabase() {
  try {
    // Initialize standard Firebase client SDK optimized for script runs
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

    const collectionsToExport = ['users', 'geckos', 'pairings', 'clutches', 'morphs', 'morph_relations'];
    const backupData: Record<string, any[]> = {};

    for (const colName of collectionsToExport) {
      console.log(`\n📦 Fetching collection: "${colName}"...`);
      try {
        const colRef = collection(db, colName);
        const snapshot = await getDocs(colRef);
        console.log(`✅ Retrieved ${snapshot.size} documents from "${colName}".`);

        backupData[colName] = [];

        for (const docSnap of snapshot.docs) {
          const docData = docSnap.data();
          const docId = docSnap.id;

          const record: Record<string, any> = {
            id: docId,
            data: docData
          };

          // If this is the "geckos" collection, handle subcollections
          if (colName === 'geckos') {
            const subcollections = ['weight_history', 'activity_logs'];
            const nestedData: Record<string, any[]> = {};

            for (const subcol of subcollections) {
              const subcolRef = collection(db, 'geckos', docId, subcol);
              try {
                const subSnap = await getDocs(subcolRef);
                if (subSnap.size > 0) {
                  nestedData[subcol] = subSnap.docs.map(subDoc => ({
                    id: subDoc.id,
                    data: subDoc.data()
                  }));
                }
              } catch (subErr: any) {
                console.warn(`   ⚠️ Warning: Could not fetch subcollection "${subcol}" for gecko ID "${docId}":`, subErr.message);
              }
            }

            if (Object.keys(nestedData).length > 0) {
              record.subcollections = nestedData;
            }
          }

          backupData[colName].push(record);
        }

      } catch (err: any) {
        console.error(`❌ Failed to read collection "${colName}":`, err.message);
        console.error("👉 Please ensure that your Firestore rule allows public reads during the export.");
      }
    }

    // Write to firestore-backup.json
    const outputPath = path.join(process.cwd(), 'firestore-backup.json');
    fs.writeFileSync(outputPath, JSON.stringify(backupData, null, 2), 'utf8');

    console.log("\n====================================================");
    console.log(`🎉 BACKUP SUCCESSFUL!`);
    console.log(`📂 Output File: ${outputPath}`);
    console.log(`📏 File Size  : ${(fs.statSync(outputPath).size / 1024).toFixed(2)} KB`);
    console.log("====================================================");

  } catch (error: any) {
    console.error("🔥 Critical export failure:", error.message || error);
  }
}

exportFullDatabase();
