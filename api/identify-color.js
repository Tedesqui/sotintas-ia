// api/identify-color.js
module.exports = async (req, res) => {
    // 1. Responde OK para verificação de segurança do navegador
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // 2. Bloqueia se não for POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido (Backend Funcionando)' });
    }

    try {
        const { image } = req.body;
        const apiKey = process.env.OPENAI_API_KEY;

        if (!apiKey) return res.status(500).json({ error: 'API Key não configurada na Vercel' });
        if (!image) return res.status(400).json({ error: 'Nenhuma imagem recebida' });

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
                            { type: "text", text: "Analise a cor da parede. Responda APENAS JSON: { \"tonalidade\": \"Nome\", \"categoria\": \"azul/verde/etc\" }. Se falhar, use 'padrao'." },
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

        let content;
        try {
             content = JSON.parse(data.choices[0].message.content);
        } catch (e) {
             content = { tonalidade: "Cor Detectada", categoria: "padrao" };
        }

        return res.status(200).json(content);

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
