const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const MODEL = 'gemini-2.0-flash';

export async function callGeminiStreaming({ apiKey, systemPrompt, userPrompt, onChunk }) {
  const url = `${GEMINI_API_BASE}/${MODEL}:streamGenerateContent?alt=sse&key=${apiKey}`;

  const body = {
    system_instruction: {
      parts: [{ text: systemPrompt }],
    },
    contents: [
      {
        role: 'user',
        parts: [{ text: userPrompt }],
      },
    ],
    generationConfig: {
      temperature: 0.8,
      maxOutputTokens: 4096,
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'object',
        properties: {
          chatMessage: {
            type: 'string',
            description: 'A conversational message to share in the team chat feed (2-4 sentences, addressing the team)',
          },
          deliverableContent: {
            type: 'string',
            description: 'The full deliverable content in markdown format',
          },
        },
        required: ['chatMessage', 'deliverableContent'],
      },
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${error}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullText = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const jsonStr = line.slice(6).trim();
      if (!jsonStr || jsonStr === '[DONE]') continue;

      try {
        const parsed = JSON.parse(jsonStr);
        const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          fullText += text;
          onChunk?.(text, fullText);
        }
      } catch {
        // Skip malformed chunks
      }
    }
  }

  // Process remaining buffer
  if (buffer) {
    const lines = buffer.split('\n');
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const jsonStr = line.slice(6).trim();
      if (!jsonStr || jsonStr === '[DONE]') continue;
      try {
        const parsed = JSON.parse(jsonStr);
        const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          fullText += text;
          onChunk?.(text, fullText);
        }
      } catch {
        // Skip
      }
    }
  }

  // Parse the complete JSON response
  try {
    const result = JSON.parse(fullText);
    return result;
  } catch {
    // If JSON parsing fails, try to extract from the text
    return {
      chatMessage: fullText.slice(0, 200),
      deliverableContent: fullText,
    };
  }
}

// Schema-based non-streaming call (for insights)
export async function callGeminiWithSchema({ apiKey, systemPrompt, userPrompt, responseSchema, maxTokens = 8192 }) {
  const url = `${GEMINI_API_BASE}/${MODEL}:generateContent?key=${apiKey}`;

  const body = {
    system_instruction: {
      parts: [{ text: systemPrompt }],
    },
    contents: [
      {
        role: 'user',
        parts: [{ text: userPrompt }],
      },
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: maxTokens,
      responseMimeType: 'application/json',
      responseSchema,
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${error}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Failed to parse insights response as JSON');
  }
}

// Non-streaming fallback
export async function callGemini({ apiKey, systemPrompt, userPrompt }) {
  const url = `${GEMINI_API_BASE}/${MODEL}:generateContent?key=${apiKey}`;

  const body = {
    system_instruction: {
      parts: [{ text: systemPrompt }],
    },
    contents: [
      {
        role: 'user',
        parts: [{ text: userPrompt }],
      },
    ],
    generationConfig: {
      temperature: 0.8,
      maxOutputTokens: 4096,
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'object',
        properties: {
          chatMessage: {
            type: 'string',
            description: 'A conversational message to share in the team chat feed (2-4 sentences, addressing the team)',
          },
          deliverableContent: {
            type: 'string',
            description: 'The full deliverable content in markdown format',
          },
        },
        required: ['chatMessage', 'deliverableContent'],
      },
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${error}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  try {
    return JSON.parse(text);
  } catch {
    return {
      chatMessage: text?.slice(0, 200) || 'Unable to parse response',
      deliverableContent: text || '',
    };
  }
}
