import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { geckoId } = req.body || {};
  
  return res.status(200).json({ 
    geckoId: geckoId || null, 
    insight: "Steady growth pattern detected." 
  });
}
