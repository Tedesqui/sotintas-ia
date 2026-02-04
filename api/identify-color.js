// api/identify-color.js

module.exports = async (req, res) => {
    // Cabeçalhos CORS para permitir que seu site converse com o backend
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    // Responde OK para a verificação do navegador (OPTIONS)
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Se tentar abrir pelo navegador (GET) ou outro método, nega.
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido. O site deve enviar um POST.' });
    }

    try {
        const { image } = req.body;
        
        // Pega a chave segura das Variáveis de Ambiente da Vercel
        const apiKey = process.env.OPENAI_API_KEY;

        if (!apiKey) {
            return res.status(500).json({ error: 'Configuração de API Key ausente na Vercel.' });
        }
        if (!image) {
            return res.status(400).json({ error: 'Nenhuma imagem recebida.' });
        }

        const prompt = `
            Analise a cor predominante desta parede.
            Responda APENAS um JSON válido neste formato:
            { "tonalidade": "Nome Criativo (ex: Verde Musgo)", "categoria": "verde" }
            
            Categorias permitidas: [branco, azul, verde, amarelo, vermelho, cinza].
            Se não for claro, use "padrao".
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

        // Tenta ler a resposta da IA
        let content;
        try {
            content = JSON.parse(data.choices[0].message.content);
        } catch (e) {
            content = { tonalidade: "Cor Detectada", categoria: "padrao" };
        }

        return res.status(200).json(content);

    } catch (error) {
        console.error("Erro API:", error);
        return res.status(500).json({ error: error.message || "Erro interno do servidor." });
    }
};
