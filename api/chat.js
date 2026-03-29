const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL    = 'llama-3.1-8b-instant';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_API_KEY) {
    return res.status(500).json({ error: { message: 'API key not configured' } });
  }

  try {
    const messages = [];
    if (req.body.system) {
      messages.push({ role: 'system', content: req.body.system });
    }
    for (const m of (req.body.messages || [])) {
      messages.push({ role: m.role, content: m.content });
    }

    const upstream = await fetch(GROQ_URL, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': 'Bearer ' + GROQ_API_KEY,
      },
      body: JSON.stringify({
        model:       MODEL,
        messages,
        max_tokens:  req.body.max_tokens || 1024,
        temperature: 0.5,
      }),
    });

    const data = await upstream.json();

    if (!upstream.ok) {
      return res.status(upstream.status).json({
        error: { message: (data.error && data.error.message) || 'Groq error' },
      });
    }

    const reply = (
      data.choices &&
      data.choices[0] &&
      data.choices[0].message &&
      data.choices[0].message.content
    ) || '';

    res.json({
      content: [{ type: 'text', text: reply }],
      model:   MODEL,
      usage:   data.usage || {},
    });

  } catch (err) {
    res.status(502).json({ error: { message: 'Proxy error: ' + err.message } });
  }
}