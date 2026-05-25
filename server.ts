import "dotenv/config";
import express from "express";
import path from "path";
import fs from "fs";
import archiver from "archiver";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  console.log(`[Server] Starting on port ${PORT}...`);
  console.log(`[Server] NODE_ENV: ${process.env.NODE_ENV}`);

  app.use(express.json());

  // Request logger for debugging
  app.use((req, res, next) => {
    if (!req.url.includes('node_modules') && !req.url.includes('@vite')) {
      console.log(`[Request] ${req.method} ${req.url}`);
    }
    next();
  });

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      timestamp: new Date().toISOString(), 
      env: process.env.NODE_ENV,
      cwd: process.cwd()
    });
  });

  app.get("/dev-test", (req, res) => {
    res.send("<h1>Server Test Page</h1><p>If you see this, the server is alive and responding.</p>");
  });

  app.get("/api/download-source", (req, res) => {
    const archive = archiver('zip', { zlib: { level: 9 } });
    res.attachment('geckofarm-pro-source.zip');
    archive.pipe(res);
    archive.glob('**/*', {
      cwd: process.cwd(),
      ignore: ['node_modules/**', 'dist/**', '.git/**', '.env', '**/*.zip'],
      dot: true
    });
    archive.finalize();
  });

  app.post("/api/geckos/stats", (req, res) => {
    const { geckoId } = req.body;
    res.json({ geckoId, insight: "Steady growth pattern detected." });
  });

  app.post("/api/analyze-morph", async (req, res) => {
    const { prompt } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.error("[Server] GEMINI_API_KEY is missing");
      return res.status(500).json({ error: "API Key Gemini tidak ditemukan. Silakan tambahkan GEMINI_API_KEY di pengaturan rahasia (Secrets)." });
    }

    try {
      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({ 
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const response = await ai.models.generateContent({ 
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: `Anda adalah pakar genetika reptil profesional (Herpticulture Geneticist) yang berspesialisasi dalam Leopard Gecko.
Tugas Anda adalah memberikan laporan intelijen breeder yang sangat teknis, akurat, dan strategis dalam BAHASA INDONESIA.

STRUKTUR LAPORAN (WAJIB):

### **1. ANALISIS STRATEGI BREEDER**
(Fokus pada interaksi fenotipe, warna, dan kualitas visual F1. Jelaskan bagaimana Morph Name akan berinteraksi secara visual.)

### **2. POTENSI GENETIK & HOLD BACK**
(Saran individu mana yang harus dipertahankan sebagai 'holdback' untuk memperkuat lineage. Identifikasi combo paling berharga.)

### **3. PENGEMBANGAN PROYEK MASA DEPAN**
(Saran pairing outcross atau F2 untuk mencapai peak visual performance di masa depan.)

### **4. ANALISIS KOMERSIAL & PASAR**
(Nilai combo ini di mata kolektor global. Seberapa kompetitif project ini?)

### **5. PERINGATAN KRITIS & RISIKO**
> Gunakan format blockquote ini untuk setiap peringatan risiko genetik, kesehatan, atau saran inbreeding yang harus dihindari.

PANDUAN GAYA:
- Gunakan istilah teknis breeder (lineage, outcross, F1, F2, selective breeding).
- Setiap menyebut nama morph atau combo, gunakan format Bold (Contoh: **Diablo Blanco**).
- Berikan analisis yang tajam dan tidak generic.`
        }
      });

      const text = response.text || "Tidak dapat menghasilkan analisis saat ini.";
      res.json({ text });
    } catch (error: any) {
      console.error("[Server] Gemini Error:", error);
      
      const errorStr = (error?.message || JSON.stringify(error) || '').toLowerCase();
      const isExpiredOrInvalid = errorStr.includes('expired') || errorStr.includes('invalid') || errorStr.includes('api_key_invalid') || error?.status === 400;
      
      if (isExpiredOrInvalid) {
        return res.status(400).json({ 
          error: "API Key Gemini Anda tidak valid atau telah kedaluwarsa. Silakan segarkan halaman dan perbarui/ganti API Key melalui menu Settings > Secrets (atau hubungkan kembali kunci API Anda) untuk melanjutkan." 
        });
      }

      const statusCode = error?.status || 500;
      const message = statusCode === 429 
        ? "Batas tingkat permintaan tercapai (Rate-limited). Silakan coba lagi dalam beberapa menit." 
        : "Gagal melakukan analisis AI. Silakan coba lagi nanti.";
      
      res.status(statusCode).json({ error: message });
    }
  });

  const distPath = path.resolve(__dirname, 'dist');
  
  if (process.env.NODE_ENV !== "production") {
    console.log("[Server] Serving with Vite middleware (Development Mode)");
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: "spa",
    });
    
    app.use(vite.middlewares);

    app.get('*', async (req, res, next) => {
      if (req.path.startsWith('/api')) return next();
      if (req.path.startsWith('/dev-test')) return next();
      
      try {
        const url = req.originalUrl;
        const indexPath = path.resolve(process.cwd(), 'index.html');
        
        if (!fs.existsSync(indexPath)) {
          return res.status(500).send(`Critical Error: index.html not found at ${indexPath}`);
        }

        let template = fs.readFileSync(indexPath, 'utf-8');
        
        console.log(`[Vite] Transforming index.html for ${url}`);
        template = await vite.transformIndexHtml(url, template);
        
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        console.error("[Vite Error] Transformation failed:", e);
        vite.ssrFixStacktrace(e as Error);
        res.status(500).send(`Vite Transformation Error: ${e instanceof Error ? e.message : String(e)}`);
      }
    });
  } else {
    console.log(`[Server] Serving static files from: ${distPath} (Production Mode)`);
    app.use(express.static(distPath));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) return next();
      
      const targetFile = path.join(distPath, 'index.html');
      if (fs.existsSync(targetFile)) {
        console.log(`[Production] Falling back to index.html for: ${req.url}`);
        res.sendFile(targetFile);
      } else {
        console.error(`[Production Error] index.html NOT FOUND at ${targetFile}`);
        res.status(404).send("Application shell not found. Please ensure build is complete.");
      }
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Ready at http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("[Server] Critical startup error:", err);
});
