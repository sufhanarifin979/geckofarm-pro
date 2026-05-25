import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  return res.status(200).json({ 
    status: "ok", 
    timestamp: new Date().toISOString(), 
    env: process.env.NODE_ENV || "production"
  });
}
