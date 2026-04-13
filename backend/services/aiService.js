const { GoogleGenerativeAI } = require('@google/generative-ai');
const pdf = require('pdf-parse');
const mammoth = require('mammoth');

/**
 * Extracts text from various file buffers
 * @param {Buffer} buffer 
 * @param {string} mimeType 
 * @returns {Promise<string>}
 */
const extractText = async (buffer, mimeType) => {
  try {
    if (!buffer || buffer.length === 0) {
      throw new Error('Empty file buffer provided');
    }

    if (mimeType === 'application/pdf') {
      const pdfParser = typeof pdf === 'function' ? pdf : pdf.default;
      if (typeof pdfParser !== 'function') {
        throw new Error('PDF parser is not correctly initialized. Try restarting the server.');
      }
      const data = await pdfParser(buffer);
      return data.text || 'No readable text found in PDF.';
    }
    
    if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const result = await mammoth.extractRawText({ buffer });
      return result.value || 'No readable text found in DOCX.';
    }

    if (mimeType === 'text/plain' || mimeType.includes('text/')) {
      return buffer.toString('utf-8');
    }

    // Default fallback
    return buffer.toString('utf-8').substring(0, 5000); 
  } catch (err) {
    console.error('Text extraction failed:', err);
    throw new Error('Failed to extract text from document: ' + err.message);
  }
};

/**
 * Summarizes document content using Gemini
 * @param {string} content 
 * @returns {Promise<string>}
 */
const summarizeContent = async (content) => {
  if (!process.env.GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY is missing!');
    throw new Error('GEMINI_API_KEY is not configured on the server.');
  }

  console.log(`[AI] Using API Key starting with: ${process.env.GEMINI_API_KEY.substring(0, 7)}...`);

  try {
    const prompt = `You are a document intelligence engine for Smart Cloud File Manager.

Analyze the document below and respond ONLY with a valid JSON object (no markdown, no code fences, no extra text). Use this exact structure:

{
  "overview": "2-3 sentence summary of what the document is about.",
  "keyPoints": ["point 1", "point 2", "point 3", "point 4", "point 5"],
  "details": ["detail 1", "detail 2", "detail 3"],
  "takeaway": "One sentence final meaning of the document."
}

Rules:
- "overview": Always provide this. Max 3 sentences.
- "keyPoints": Always provide 3-5 of the most important ideas.
- "details": Extract specific names, dates, numbers, stats, or entities mentioned. If none, use an empty array [].
- "takeaway": Always provide a single actionable sentence.
- Do NOT include markdown formatting, asterisks, or hashtags in any value.

DOCUMENT CONTENT:
${content.substring(0, 30000)}
`;

    console.log(`[AI] Attempting OpenRouter Fetch...`);
    
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.GEMINI_API_KEY}`,
          "X-Title": "Smart Cloud File Manager",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "google/gemini-2.0-flash-001",
          messages: [
            { role: "user", content: prompt }
          ]
        })
      }
    );

    const data = await response.json();
    
    if (data.error) {
      console.error('[AI] OpenRouter Error:', JSON.stringify(data.error));
      throw new Error(data.error.message || 'OpenRouter API Error');
    }

    if (data.choices && data.choices[0]?.message?.content) {
      console.log(`[AI] OpenRouter SUCCESS`);
      return data.choices[0].message.content;
    }

    throw new Error('Unexpected OpenRouter response structure');

  } catch (err) {
    console.error('[AI] OpenRouter Overall Failure:', err);
    throw new Error('AI Summarization failed: ' + err.message);
  }
};

module.exports = {
  extractText,
  summarizeContent
};
