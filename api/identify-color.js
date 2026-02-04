export const config = {
  maxDuration: 10,
};

export default async function handler(request, response) {
  // Corrige problema de CORS e Métodos
  response.setHeader('Access-Control-Allow-Credentials', true);
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  response.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (request.method === 'OPTIONS') {
    response.status(200).end();
    return;
  }

  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { image } = request.body;
    const apiKey = process.env.OPENAI_API_KEY;

    if (!image) return response.status(400).json({ error: 'Imagem não fornecida' });
    if (!apiKey) return response.status(500).json({ error: 'API Key não configurada' });

    const prompt = `
      Analise a cor da parede.
      Responda ESTRITAMENTE um JSON:
      { "tonalidade": "Nome Exato (ex: Azul Marinho)", "categoria": "azul" }
      Categorias possiveis: [branco, azul, verde, amarelo, vermelho, cinza].
      Se nada bater, use 'padrao'.
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

    const content = JSON.parse(data.choices[0].message.content);
    return response.status(200).json(content);

  } catch (error) {
    return response.status(500).json({ error: error.message });
  }
}
