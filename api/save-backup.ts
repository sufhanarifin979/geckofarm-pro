import type { VercelRequest, VercelResponse } from '@vercel/node';
import fs from 'fs';
import path from 'path';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const backupData = req.body;
  if (!backupData) {
    return res.status(400).json({ error: 'Payload pencadangan kosong (Empty backup data)' });
  }

  try {
    const outputPath = path.join(process.cwd(), 'firestore-backup.json');
    fs.writeFileSync(outputPath, JSON.stringify(backupData, null, 2), 'utf8');
    
    const stats: Record<string, number> = {};
    for (const col of Object.keys(backupData)) {
      if (backupData[col] && backupData[col].documents) {
        stats[col] = Object.keys(backupData[col].documents).length;
      } else if (Array.isArray(backupData[col])) {
        stats[col] = backupData[col].length;
      } else {
        stats[col] = 0;
      }
    }

    const fileSize = fs.statSync(outputPath).size;
    const sizeKb = fileSize / 1024;

    console.log(`[Backup Serverless] Berhasil menulis file cadangan. Ukuran: ${sizeKb.toFixed(2)} KB. Jumlah Dokumen:`, stats);
    
    return res.status(200).json({ 
      success: true, 
      path: outputPath, 
      sizeKb, 
      counts: stats 
    });
  } catch (err: any) {
    console.error("[Backup Serverless] Gagal menyimpan cadangan:", err);
    return res.status(500).json({ 
      error: "Gagal menyimpan file pencadangan di server", 
      message: err.message 
    });
  }
}
