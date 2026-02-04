export const config = {
  maxDuration: 15, // Aumentei levemente o tempo pois a resposta é mais complexa
};

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { image } = request.body;

    if (!image) {
      return response.status(400).json({ error: 'Imagem não fornecida' });
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return response.status(500).json({ error: 'Chave da API não configurada' });
    }

    // --- MUDANÇA NO PROMPT ---
    const prompt = `
      Você é um especialista em design de interiores e tintas. Analise a cor da parede nesta imagem.
      
      1. Identifique o NOME ESPECÍFICO da tonalidade (seja criativo e preciso, use termos de mercado como: Verde Musgo, Verde Oliva, Azul Marinho, Azul Royal, Branco Gelo, Branco Neve, Cinza Cimento, etc).
      2. Identifique a CATEGORIA BASE para escolhermos o vídeo correto. As categorias possíveis são APENAS: [branco, azul, verde, amarelo, vermelho, cinza]. Se não for nenhuma, use 'padrao'.

      Responda ESTRITAMENTE no formato JSON abaixo, sem blocos de código ou markdown:
      {
        "tonalidade": "Nome da Tonalidade Identificada",
        "categoria": "categoria_base_em_minusculo"
      }
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
        response_format: { type: "json_object" } // Força a resposta em JSON
      })
    });

    const data = await openAiResponse.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    // Parse do JSON retornado pela IA
    const content = JSON.parse(data.choices[0].message.content);

    return response.status(200).json({ 
      tonalidade: content.tonalidade,
      categoria: content.categoria
    });

  } catch (error) {
    console.error(error);
    return response.status(500).json({ error: error.message });
  }
}