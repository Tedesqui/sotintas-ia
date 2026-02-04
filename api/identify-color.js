// api/identify-color.js
// Usando sintaxe padrão do Node.js para compatibilidade máxima

module.exports = async (req, res) => {
  // 1. Configurar CORS manualmente (Para aceitar requisições do seu site)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // 2. Responder imediatamente ao "Preflight" (OPTIONS) do navegador
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 3. Bloquear qualquer coisa que não seja POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido. Use POST.' });
  }

  try {
    const { image } = req.body;
    const apiKey = process.env.OPENAI_API_KEY;

    if (!image) return res.status(400).json({ error: 'Imagem não recebida.' });
    if (!apiKey) return res.status(500).json({ error: 'Chave da API não configurada na Vercel.' });

    // 4. Chamada à OpenAI
    const prompt = `
      Você é um especialista em tintas. Analise a cor da parede nesta imagem.
      Responda APENAS com este JSON exato, sem markdown:
      { "tonalidade": "Nome Criativo da Cor", "categoria": "cor_base" }
      
      As categorias permitidas são APENAS: [branco, azul, verde, amarelo, vermelho, cinza].
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
        max_tokens: 60,
        response_format: { type: "json_object" }
      })
    });

    const data = await openAiResponse.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    // 5. Tratamento de resposta
    let content;
    try {
      content = JSON.parse(data.choices[0].message.content);
    } catch (e) {
      // Caso a IA não mande JSON perfeito, forçamos um fallback
      console.error("Erro ao ler JSON da IA:", data.choices[0].message.content);
      content = { tonalidade: "Cor Identificada", categoria: "padrao" };
    }

    return res.status(200).json(content);

  } catch (error) {
    console.error("Erro no Backend:", error);
    return res.status(500).json({ error: error.message || "Erro interno no servidor." });
  }
};
