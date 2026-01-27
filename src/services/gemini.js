/**
 * Gemini API service for text generation and API key validation
 */

import logger from './logger'

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'
const MODEL = 'gemini-2.5-flash'

/**
 * Preset topic suggestions for text generation
 */
export const PRESET_TOPICS = [
  { id: 'conversation', label: 'Daily conversation', prompt: 'Generate a short everyday conversation in English about greeting someone and asking how they are doing.' },
  { id: 'travel', label: 'Travel scenarios', prompt: 'Generate a short English text about traveling, asking for directions, or checking into a hotel.' },
  { id: 'food', label: 'Food and dining', prompt: 'Generate a short English text about ordering food at a restaurant or discussing favorite meals.' },
  { id: 'shopping', label: 'Shopping', prompt: 'Generate a short English text about shopping for clothes or groceries, including prices and sizes.' },
  { id: 'weather', label: 'Weather discussion', prompt: 'Generate a short English text discussing the weather and making plans based on it.' }
]

/**
 * Call the Gemini API with a prompt
 */
async function callGeminiAPI(apiKey, prompt) {
  const endpoint = `${GEMINI_API_BASE}/${MODEL}:generateContent?key=${apiKey}`
  
  logger.apiRequest(endpoint, 'POST', { promptLength: prompt.length })
  
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024
      }
    })
  })
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    logger.apiFail(endpoint, { status: response.status, error: errorData })
    throw new Error(errorData.error?.message || `API request failed with status ${response.status}`)
  }
  
  const data = await response.json()
  logger.apiSuccess(endpoint, { hasResponse: !!data.candidates })
  
  return data
}

/**
 * Extract text content from Gemini API response
 */
function extractTextFromResponse(response) {
  if (!response.candidates || response.candidates.length === 0) {
    throw new Error('No response generated')
  }
  
  const candidate = response.candidates[0]
  if (!candidate.content || !candidate.content.parts) {
    throw new Error('Invalid response format')
  }
  
  const textParts = candidate.content.parts
    .filter(part => part.text)
    .map(part => part.text)
  
  return textParts.join('\n').trim()
}

/**
 * Validate an API key by making a test request
 */
export async function validateApiKey(apiKey) {
  logger.api('Validating API key...')
  
  try {
    const response = await callGeminiAPI(apiKey, 'Say "Hello" in one word.')
    const text = extractTextFromResponse(response)
    
    if (text) {
      logger.actionSuccess('API key is valid')
      return { valid: true, message: 'API key is valid' }
    } else {
      logger.actionFail('API key validation failed - empty response')
      return { valid: false, message: 'Received empty response from API' }
    }
  } catch (error) {
    logger.error('API key validation failed', error)
    return { valid: false, message: error.message || 'Failed to validate API key' }
  }
}

/**
 * Generate English text using a custom prompt
 */
export async function generateText(apiKey, userPrompt, maxLength = 1000) {
  logger.api('Generating text with custom prompt')
  
  const systemPrompt = `You are a helpful assistant that generates English text for language learning purposes. 
Generate clear, natural English text based on the user's request.
Keep the text under ${maxLength} characters.
Do not include any meta-commentary or explanations - just provide the text itself.
Make sure the text contains complete sentences that are suitable for translation practice.
IMPORTANT: Each sentence must start on a new line.`

  const fullPrompt = `${systemPrompt}\n\nUser request: ${userPrompt}`
  
  try {
    const response = await callGeminiAPI(apiKey, fullPrompt)
    const text = extractTextFromResponse(response)
    
    // Truncate if needed
    const truncatedText = text.length > maxLength ? text.substring(0, maxLength) : text
    
    logger.actionSuccess('Text generated', { length: truncatedText.length })
    return { success: true, text: truncatedText }
  } catch (error) {
    logger.error('Text generation failed', error)
    return { success: false, error: error.message || 'Failed to generate text' }
  }
}

/**
 * Generate text using a preset topic
 */
export async function generateFromPreset(apiKey, presetId, maxLength = 1000) {
  const preset = PRESET_TOPICS.find(p => p.id === presetId)
  if (!preset) {
    return { success: false, error: 'Invalid preset topic' }
  }
  
  logger.api(`Generating text from preset: ${preset.label}`)
  return generateText(apiKey, preset.prompt, maxLength)
}

/**
 * Split text into sentences
 */
export function splitIntoSentences(text) {
  logger.action('Splitting text into sentences')
  
  // Split by sentence-ending punctuation followed by whitespace
  // This regex looks for .!? followed by space or end of string
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 0)
  
  logger.actionSuccess(`Split into ${sentences.length} sentences`)
  return sentences
}

/**
 * Format context sentences for the review prompt
 */
function formatContextSentences(sentences) {
  if (!sentences || sentences.length === 0) {
    return 'No surrounding context available.'
  }
  return sentences.map((s, i) => `${i + 1}. "${s}"`).join('\n')
}

/**
 * Review a user's Dutch translation using AI
 */
export async function reviewTranslation(apiKey, englishText, dutchTranslation, contextBefore = [], contextAfter = []) {
  logger.api('Reviewing translation with AI')
  
  const precedingSentences = formatContextSentences(contextBefore)
  const followingSentences = formatContextSentences(contextAfter)
  
  const prompt = `You are a Dutch language tutor reviewing an English to Dutch translation. Be encouraging but thorough in your feedback.

## Context
The sentence being translated is part of a larger text. Here is the surrounding context:

**Preceding sentences:**
${precedingSentences}

**Sentence to review:**
- English: ${englishText}
- User's translation: ${dutchTranslation}

**Following sentences:**
${followingSentences}

## Your Task
1. **Evaluate** the user's Dutch translation for accuracy, grammar, and natural phrasing
2. **Identify** any errors or areas for improvement
3. **Provide** a corrected/improved translation

## Response Format
Respond using Markdown with the following structure:

### Overall Assessment
[One of: ✅ Excellent | 👍 Good | ⚠️ Needs Improvement | ❌ Incorrect]

### Feedback
[2-3 sentences explaining what the user did well and what needs improvement. Be specific about grammar, word choice, word order, or spelling issues. Use **bold** to highlight specific Dutch words or phrases being discussed.]

### Corrections
[If there are errors, list them as bullet points. Format each as:]
- **[incorrect word/phrase]** → **[correct word/phrase]**: [brief explanation in italics]

[If no corrections needed, write: "No corrections needed - great job!"]

### Suggested Translation
> [Your recommended Dutch translation in a blockquote]

### Tips
💡 [One helpful tip for remembering this grammar rule or vocabulary. Use \`inline code\` for specific Dutch words or grammar terms.]

## Styling Guidelines
- Use **bold** for Dutch words and phrases that are being discussed or corrected
- Use *italics* for explanations and grammar terminology
- Use \`inline code\` for grammar terms (e.g., \`de-woorden\`, \`het-woorden\`, \`perfectum\`)
- Use > blockquotes for the suggested translation to make it stand out
- Use bullet points for listing multiple corrections
- Keep paragraphs short (2-3 sentences max) for readability`

  try {
    const response = await callGeminiAPI(apiKey, prompt)
    const reviewContent = extractTextFromResponse(response)
    
    logger.actionSuccess('Translation review generated')
    return { success: true, content: reviewContent }
  } catch (error) {
    logger.error('Translation review failed', error)
    return { success: false, error: error.message || 'Failed to review translation' }
  }
}
