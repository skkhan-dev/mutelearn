const GEMINI_MODEL = 'gemini-2.0-flash';
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

function getApiKey() {
  try {
    return localStorage.getItem('mutelearn-gemini-key') || '';
  } catch {
    return '';
  }
}

async function callGemini(parts, { maxTokens = 2048 } = {}) {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('NO_GEMINI_KEY');

  const res = await fetch(`${GEMINI_URL}/${GEMINI_MODEL}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: { maxOutputTokens: maxTokens, temperature: 0.3 },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error (${res.status}): ${err}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return text;
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

  const text = await callGemini([
    {
      inlineData: { mimeType, data: base64Data },
    },
    {
      text: `Extract ALL text from this image. This could be handwritten notes, a textbook page, a whiteboard, or a worksheet. Return the extracted text as accurately as possible, preserving structure like headings, bullet points, and paragraphs. If there are diagrams, describe them briefly. Return ONLY the extracted text, nothing else.`,
    },
  ]);

  return text.trim();
}

export async function extractFromText(rawText) {
  const prompt = `You are a study assistant. Analyze the following content and extract structured study material. Return ONLY valid JSON in this exact format:

{
  "summary": "A clear 2-3 sentence summary of the main topic",
  "keyTerms": [
    {"term": "Term name", "definition": "Clear definition"}
  ],
  "concepts": ["Main concept 1 explained clearly", "Main concept 2 explained clearly"],
  "facts": ["Important fact 1", "Important fact 2"],
  "flashcards": [
    {"front": "Question about the content", "back": "Answer based on the content"}
  ]
}

Extract 5-10 key terms with definitions, 3-5 main concepts, 5-8 facts, and 5-8 flashcard pairs. Make flashcards specific and useful for studying. Adapt the difficulty level to the content.

Content to analyze:
${rawText.slice(0, 8000)}`;

  const text = await callGemini([{ text: prompt }], { maxTokens: 3000 });
  const parsed = parseJSON(text);

  if (!parsed) {
    throw new Error('Failed to parse AI response. Try again.');
  }

  return {
    summary: parsed.summary || '',
    keyTerms: Array.isArray(parsed.keyTerms) ? parsed.keyTerms : [],
    concepts: Array.isArray(parsed.concepts) ? parsed.concepts : [],
    facts: Array.isArray(parsed.facts) ? parsed.facts : [],
    flashcards: Array.isArray(parsed.flashcards) ? parsed.flashcards : [],
  };
}

export async function generateFlashcards(text, count = 10) {
  const prompt = `Create exactly ${count} flashcard pairs from this study content. Each flashcard should test understanding, not just memorization. Return ONLY valid JSON array:

[{"front": "Question", "back": "Answer"}]

Content:
${text.slice(0, 6000)}`;

  const result = await callGemini([{ text: prompt }]);
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
  const prompt = `Create ${count} quiz questions from this content. Mix multiple choice, true/false, and short answer. Return ONLY valid JSON array:

[
  {
    "question": "The question text",
    "type": "multiple-choice",
    "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
    "correctAnswer": "A) ...",
    "explanation": "Why this is correct"
  }
]

For true/false: type="true-false", options=["True","False"]. For short answer: type="short-answer", no options, correctAnswer is the expected text.

Content:
${text.slice(0, 6000)}`;

  const result = await callGemini([{ text: prompt }], { maxTokens: 2500 });
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
  const prompt = `Summarize this study content in 3-5 clear, concise bullet points. Focus on what a student needs to remember. Return plain text with bullet points (use - for each point).

Content:
${text.slice(0, 6000)}`;

  return await callGemini([{ text: prompt }]);
}

export function isGeminiConfigured() {
  return Boolean(getApiKey());
}
