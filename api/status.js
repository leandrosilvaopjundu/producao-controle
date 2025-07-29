// API route para status no Vercel
export default function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    res.status(200).json({
      status: "online",
      version: "4.0.0",
      platform: "Vercel",
      firebase: "configurado",
      storage_mode: "Vercel + Firebase"
    });
  } else {
    res.status(405).json({ error: 'Método não permitido' });
  }
}

