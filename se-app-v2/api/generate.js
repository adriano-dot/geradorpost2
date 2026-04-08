export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY não configurada.' });

  const { prompt, imageBase64, imageType } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Campo prompt obrigatório.' });

  var msgContent;
  if (imageBase64) {
    msgContent = [
      { type: 'image', source: { type: 'base64', media_type: imageType || 'image/jpeg', data: imageBase64 } },
      { type: 'text', text: prompt }
    ];
  } else {
    msgContent = prompt;
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        messages: [{ role: 'user', content: msgContent }]
      })
    });

    if (!response.ok) {
      const err = await response.json();
      return res.status(response.status).json({ error: (err.error && err.error.message) || 'Erro API' });
    }

    const data = await response.json();
    const text = data.content.map(c => c.text || '').join('');
    return res.status(200).json({ html: text });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Erro interno' });
  }
}
