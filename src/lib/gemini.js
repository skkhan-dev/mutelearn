async function callAI(body) {
  const res = await fetch('/api/ai/process', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`AI processing failed (${res.status}): ${err}`);
  }

  const data = await res.json();
  return data.text || '';
}

function parseJSON(text) {
  const match = text.match(/```json\s*([\s\S]*?)```/) || text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[1] || match[0]);
  } catch {
    return null;
  }
}

export async function extractFromImage(imageBase64) {
  const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
  const mimeType = imageBase64.match(/^data:(image\/\w+);/)?.[1] || 'image/jpeg';

  return await callAI({
    action: 'ocr',
    image: { mimeType, data: base64Data },
  });
}

export async function extractFromText(rawText) {
  const text = await callAI({
    action: 'extract',
    content: rawText.slice(0, 8000),
  });

  const parsed = parseJSON(text);
  if (!parsed) throw new Error('Failed to parse AI response. Try again.');

  return {
    summary: parsed.summary || '',
    keyTerms: Array.isArray(parsed.keyTerms) ? parsed.keyTerms : [],
    concepts: Array.isArray(parsed.concepts) ? parsed.concepts : [],
    facts: Array.isArray(parsed.facts) ? parsed.facts : [],
    flashcards: Array.isArray(parsed.flashcards) ? parsed.flashcards : [],
  };
}

export async function generateFlashcards(text, count = 10) {
  const result = await callAI({
    action: 'flashcards',
    content: text.slice(0, 6000),
    count,
  });

  const match = result.match(/\[[\s\S]*\]/);
  if (!match) return [];
  try {
    const cards = JSON.parse(match[0]);
    return Array.isArray(cards) ? cards.filter((c) => c.front && c.back) : [];
  } catch {
    return [];
  }
}

export async function generateQuiz(text, count = 5) {
  const result = await callAI({
    action: 'quiz',
    content: text.slice(0, 6000),
    count,
  });

  const match = result.match(/\[[\s\S]*\]/);
  if (!match) return [];
  try {
    const questions = JSON.parse(match[0]);
    return Array.isArray(questions) ? questions : [];
  } catch {
    return [];
  }
}

export async function summarizeContent(text) {
  return await callAI({
    action: 'summarize',
    content: text.slice(0, 6000),
  });
}

export function isGeminiConfigured() {
  return true; // Server-side key — always available
}
