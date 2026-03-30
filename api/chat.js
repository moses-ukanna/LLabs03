const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

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

    // Read as text first — .json() throws on empty or non-JSON body
    const raw = await upstream.text();
    let data;
    try {
      data = raw ? JSON.parse(raw) : {};
    } catch {
      console.error('[chat] Non-JSON from Groq:', raw.slice(0, 200));
      return res.status(502).json({ error: { message: 'Non-JSON response from Groq API' } });
    }

    if (!upstream.ok) {
      console.error('[chat] Groq ' + upstream.status + ':', JSON.stringify(data));
      return res.status(upstream.status).json({
        error: { message: (data.error && data.error.message) || ('Groq error ' + upstream.status) },
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