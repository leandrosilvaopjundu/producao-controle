// API route para registros no Vercel
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

  // Armazenamento temporário (em produção seria Firebase)
  const registros_temp = [];

  if (req.method === 'GET') {
    // Listar registros
    res.status(200).json(registros_temp);
  } else if (req.method === 'POST') {
    // Salvar registro
    const dados = req.body;
    dados.id = Date.now();
    dados.timestamp = new Date().toISOString();
    
    registros_temp.push(dados);
    
    res.status(200).json({
      success: true,
      message: "Registro salvo com sucesso!",
      id: dados.id
    });
  } else {
    res.status(405).json({ error: 'Método não permitido' });
  }
}

