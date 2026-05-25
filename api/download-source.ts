import type { VercelRequest, VercelResponse } from '@vercel/node';
import archiver from 'archiver';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    // Set headers for file attachment download
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename=geckofarm-pro-source.zip');
    
    archive.pipe(res);
    archive.glob('**/*', {
      cwd: process.cwd(),
      ignore: ['node_modules/**', 'dist/**', '.git/**', '.env', '**/*.zip', '.vercel/**'],
      dot: true
    });
    
    archive.finalize();
  } catch (error: any) {
    console.error("[Serverless] Download Source Error:", error);
    if (!res.headersSent) {
      return res.status(500).json({ error: "Gagal mengompresi dan mengunduh kode sumber." });
    }
  }
}
