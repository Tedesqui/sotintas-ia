// api/identify-color.js

module.exports = async (req, res) => {
  // Configuração de CORS (Essencial para não ser bloqueado)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Responde rápido para requisições de verificação (preflight)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Garante que só aceita POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { image } = req.body;
    // Pega a chave das Variáveis de Ambiente da Vercel
    const apiKey = process.env.OPENAI_API_KEY;

    if (!image) return res.status(400).json({ error: 'Imagem não fornecida' });
    if (!apiKey) return res.status(500).json({ error: 'Chave API não configurada' });

    const prompt = `
      Analise a cor da parede.
      Responda ESTRITAMENTE um JSON:
      { "tonalidade": "Nome da Cor", "categoria": "cor_base" }
      Categorias permitidas: [branco, azul, verde, amarelo, vermelho, cinza].
      Se não identificar, use "padrao".
    `;

    const openAiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: image, detail: "low" } }
            ]
          }
        ],
        max_tokens: 50,
        response_format: { type: "json_object" }
      })
    });

    const data = await openAiResponse.json();
    
    if (data.error) throw new Error(data.error.message);

    // Tenta fazer o parse do conteúdo
    let content;
    try {
        content = JSON.parse(data.choices[0].message.content);
    } catch (e) {
        content = { tonalidade: "Cor Identificada", categoria: "padrao" };
    }

    return res.status(200).json(content);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
