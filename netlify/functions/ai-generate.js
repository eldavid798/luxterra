/* ══════════════════════════════════════════
   LUXTERRA — netlify/functions/ai-generate.js
   Usando Google Gemini API
══════════════════════════════════════════ */

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: { message: 'GEMINI_API_KEY no configurada en variables de entorno.' } })
    };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: { message: 'Body inválido.' } }) };
  }

  const { systemPrompt, userPrompt } = body;

  // Gemini 1.5 Flash — gratis y rápido
  const GEMINI_MODEL = 'gemini-3.8-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

  const geminiBody = {
    system_instruction: {
      parts: [{ text: systemPrompt }]
    },
    contents: [
      {
        role: 'user',
        parts: [{ text: userPrompt }]
      }
    ],
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 1500,
    }
  };

  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiBody)
    });

    const data = await resp.json();

    if (!resp.ok) {
      const msg = data?.error?.message || `Error Gemini ${resp.status}`;
      return {
        statusCode: resp.status,
        body: JSON.stringify({ error: { message: msg } })
      };
    }

    // Extraer texto de la respuesta de Gemini
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: { message: err.message || 'Error interno.' } })
    };
  }
};
