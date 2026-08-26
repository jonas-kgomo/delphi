import { generateObject, generateText } from 'ai';
import { createGroq } from '@ai-sdk/groq';
import { z } from 'zod';
import { QuestionType, Survey, AIModelType, BridgingNarrative, DataEssay } from "../types";

type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

// Initialize Provider — all models route through Groq
const groq = createGroq({ apiKey: import.meta.env.VITE_GROQ_API_KEY });

// --- Model Configuration ---
// Groq deprecations (2026-07-17): llama-4-scout + qwen3-32b → qwen/qwen3.6-27b
// Strict json_schema: openai/gpt-oss-20b, openai/gpt-oss-120b
// Qwen 3.6: JSON Object / prompt-JSON only (dual thinking + non-thinking modes)

type ReasoningEffort = 'none' | 'default' | 'low' | 'medium' | 'high';

interface ModelConfig {
  id: string;
  /** strict = native json_schema; prompt-json = schema-in-prompt (+ optional thinking) */
  structuredOutputs: 'strict' | 'prompt-json';
  reasoningEffort?: ReasoningEffort;
  /** Cap completion tokens. Qwen free-tier TPM is 8k (prompt + max_tokens counts). */
  maxOutputTokens: number;
}

const MODEL_CONFIG: Record<AIModelType, ModelConfig> = {
  herald:   { id: 'openai/gpt-oss-20b',  structuredOutputs: 'strict',      maxOutputTokens: 3000 },
  oracle:   { id: 'qwen/qwen3.6-27b',    structuredOutputs: 'prompt-json', reasoningEffort: 'none',    maxOutputTokens: 3500 },
  sibyl:    { id: 'qwen/qwen3.6-27b',    structuredOutputs: 'prompt-json', reasoningEffort: 'default', maxOutputTokens: 4500 },
  composer: { id: 'openai/gpt-oss-120b', structuredOutputs: 'strict',      maxOutputTokens: 4000 },
};

const getModel = (modelType: AIModelType) => groq(MODEL_CONFIG[modelType]?.id || 'openai/gpt-oss-20b');

const groqProviderOptions = (config: ModelConfig) => ({
  groq: {
    ...(config.reasoningEffort ? { reasoningEffort: config.reasoningEffort } : {}),
    // Hide chain-of-thought from the text payload; we only want the final answer / JSON
    reasoningFormat: 'hidden' as const,
  },
});

// --- Survey Zod Schema ---
// Groq strict json_schema requires EVERY property in `required`.
// Optional fields must be present as nullable (not Zod .optional()).

const surveySchema = z.object({
  title: z.string().describe("A creative, engaging title for the survey."),
  description: z.string().describe("A brief, welcoming description of what the survey is about."),
  questions: z.array(z.object({
    text: z.string().describe("The question text. For Matrix, this is the main prompt."),
    type: z.enum([
      QuestionType.MultipleChoice,
      QuestionType.Scale,
      QuestionType.ShortText,
      QuestionType.LongText,
      QuestionType.YesNo,
      QuestionType.Matrix,
      QuestionType.AB_TEST
    ]),
    options: z.array(z.string()).nullable().describe("Options for MultipleChoice / Matrix columns / AB_TEST items. Null if unused."),
    rows: z.array(z.string()).nullable().describe("Matrix rows only. Null if unused."),
    minLabel: z.string().nullable().describe("Scale low-end label, or null."),
    maxLabel: z.string().nullable().describe("Scale high-end label, or null."),
  }))
});

// --- Survey Generation ---

// Compact JSON schema for prompt injection (Qwen prompt-json path)
const SURVEY_SCHEMA_PROMPT = `{
  "title": "string",
  "description": "string",
  "questions": [{ "text": "string", "type": "MULTIPLE_CHOICE|SCALE|SHORT_TEXT|LONG_TEXT|YES_NO|MATRIX|AB_TEST", "options?": ["string"], "rows?": ["string"], "minLabel?": "string", "maxLabel?": "string" }]
}`;

const baseUserPrompt = (goal: string) => `Create a survey (6–12 questions) for this research goal: "${goal}".
Unbiased, clear, best-practice design. Mix text and quantitative types.
Use MATRIX for grouped ratings, SCALE for 1–5, MULTIPLE_CHOICE for lists, AB_TEST for pairwise comparisons (put items in options).`;

/** Strip markdown fences / residual <think> blocks from model text before JSON.parse */
const extractJson = (text: string): unknown => {
  let cleaned = (text || '').replace(/<think>[\s\S]*?<\/think>/g, '').trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  // If the model wrapped JSON in prose, grab the outermost object
  if (!cleaned.startsWith('{')) {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start >= 0 && end > start) cleaned = cleaned.slice(start, end + 1);
  }
  if (!cleaned) throw new Error('Model returned empty response (no JSON).');
  return JSON.parse(cleaned);
};

/**
 * strict models → generateObject (native json_schema)
 * prompt-json (Qwen 3.6) → generateText with schema in prompt
 */
export const generateSurveyFromGoal = async (goal: string, modelType: AIModelType): Promise<Survey> => {
  const config = MODEL_CONFIG[modelType] || MODEL_CONFIG.herald;
  const model = getModel(modelType);

  try {
    let parsed: any;

    if (config.structuredOutputs === 'prompt-json') {
      const { text } = await generateText({
        model,
        system: `You are an expert survey methodologist for The Precinct. Output ONLY a valid JSON object matching this schema:\n${SURVEY_SCHEMA_PROMPT}\nNo markdown fences. No explanation outside JSON.`,
        prompt: baseUserPrompt(goal),
        maxRetries: 0,
        maxOutputTokens: config.maxOutputTokens,
        providerOptions: groqProviderOptions(config),
      });
      parsed = extractJson(text);
    } else {
      const { object } = await generateObject({
        model,
        schema: surveySchema,
        system: "You are an expert survey methodologist for The Precinct.",
        prompt: baseUserPrompt(goal),
        maxRetries: 0,
        maxOutputTokens: config.maxOutputTokens,
        providerOptions: {
          groq: { structuredOutputs: true, strictJsonSchema: true },
        },
      });
      parsed = object;
    }

    const typedQuestions = (parsed.questions || []).map((q: any) => ({
      text: q.text,
      type: q.type as QuestionType,
      id: crypto.randomUUID(),
      ...(q.options?.length ? { options: q.options } : {}),
      ...(q.rows?.length ? { rows: q.rows } : {}),
      ...(q.minLabel ? { minLabel: q.minLabel } : {}),
      ...(q.maxLabel ? { maxLabel: q.maxLabel } : {}),
    }));

    return {
      id: crypto.randomUUID(),
      title: parsed.title || "Untitled Survey",
      description: parsed.description || "",
      questions: typedQuestions
    };
  } catch (error) {
    console.error(`Error generating survey with ${modelType} (${config.id}):`, error);
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to generate survey with ${modelType} (${config.id}): ${detail}`);
  }
};

// --- Interviewer Chat ---

// Max conversation turns to keep in context (excluding system prompt)
const MAX_HISTORY_MESSAGES = 8;

class AIChatSimulator {
  private history: ChatMessage[] = [];
  private systemMessage: ChatMessage;
  private model: any;
  private providerOptions: ReturnType<typeof groqProviderOptions>;

  constructor(systemPrompt: string, model: any, config: ModelConfig) {
    this.model = model;
    this.systemMessage = { role: 'system', content: systemPrompt };
    this.history = [];
    this.providerOptions = groqProviderOptions(config);
  }

  async sendMessage({ message }: { message: string }) {
    this.history.push({ role: 'user', content: message });

    // Sliding window: keep only the last N messages + system
    const trimmedHistory = this.history.length > MAX_HISTORY_MESSAGES
      ? this.history.slice(-MAX_HISTORY_MESSAGES)
      : this.history;

    try {
      const { text } = await generateText({
        model: this.model,
        messages: [this.systemMessage, ...trimmedHistory],
        maxRetries: 0, // Don't retry on rate limit — surface error immediately
        maxOutputTokens: 1024,
        providerOptions: this.providerOptions,
      });

      let cleanText = (text || '').replace(/<think>[\s\S]*?<\/think>/g, '').trim();
      if (!cleanText) {
        return { text: "I'm having a bit of trouble connecting right now. You can try switching models." };
      }
      this.history.push({ role: 'assistant', content: cleanText });
      return { text: cleanText };
    } catch (err) {
      console.error(err);
      return { text: "I'm having a bit of trouble connecting right now. You can try switching models." };
    }
  }
}

// --- Transcription (Groq Whisper REST API) ---

export const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  if (!apiKey) throw new Error("Groq API Key is missing.");

  const formData = new FormData();
  formData.append('file', audioBlob, 'audio.webm');
  formData.append('model', 'whisper-large-v3-turbo');
  formData.append('temperature', '0');

  const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}` },
    body: formData
  });

  if (!response.ok) {
    const err = await response.text();
    console.error("Transcription error:", err);
    throw new Error("Failed to transcribe audio.");
  }

  const data = await response.json();
  return data.text || "";
};

// --- Interview Session Factory ---

export type InterviewParticipant = {
  name: string;
  email: string;
};

// Short ID mapping: the prompt uses Q0, Q1... to save tokens.
// The Interviewer's fallback parser also handles these.
export const createInterviewSession = (
  survey: Survey,
  modelType: AIModelType,
  participant?: InterviewParticipant
) => {
  // Build compact question reference: Q0, Q1... with short IDs
  const questionTable = survey.questions.map((q, i) => {
    let line = `Q${i}="${q.text}" type=${q.type} id=${q.id.slice(0, 8)}`;
    if (q.options?.length) line += ` opts=[${q.options.join('|')}]`;
    if (q.rows?.length) line += ` rows=[${q.rows.join('|')}]`;
    return line;
  }).join('\n');

  // Build ID lookup for the example (use first question's short id)
  const q0Short = survey.questions[0]?.id.slice(0, 8) || 'abc';
  const firstName = participant?.name?.split(/\s+/)[0] || 'there';

  const systemPrompt = `You are The Precinct interviewer — a skilled human interviewer, not a form. You conduct a warm, attentive conversation that still collects structured answers.

Survey: "${survey.title}"
Context: ${survey.description || 'General research interview'}
Participant: ${participant?.name || 'Guest'} (${participant?.email || 'no email'})
Address them as ${firstName} naturally (not every message).

Questions (cover in order — do not skip ahead):
${questionTable}

CONVERSATION RULES:
1. Consent is already given in the chat UI. Open warmly (who you are, what this is about, roughly how long), then ask Q0 — do not re-ask for name, email, or consent.
2. After each answer, briefly reflect what you heard (1 sentence) so they feel understood — then move on OR probe.
3. If an answer is thin, vague, one-word (when texture matters), off-topic, or contradicts earlier points: do NOT advance. Ask one specific follow-up. Tag with [[PROBE]] and keep the same [[QID:<id>]].
4. Structured controls (scale/choice/matrix) still need a clear selection — but invite a short "why" in your wording when useful.
5. One question focus at a time. Keep messages concise (2–5 short sentences). Never lecture.
6. When all questions are richly answered, thank them by name and end with [[END_OF_SURVEY]].

FORMAT:
- New or continuing question: end with [[QID:<id>]] (id from the list).
- Probe (insufficient answer): include [[PROBE]] and the same [[QID:<id>]].
- AB_TEST pairwise: [[QID:<id>|OptA|OptB]]
- Done: [[END_OF_SURVEY]]
Never output [[SCALE]] or [[MULTIPLE_CHOICE]]. Always use [[QID:<id>]].
Example: "Thanks ${firstName} — that helps. What stands out most about…? [[QID:${q0Short}]]"`;

  const config = MODEL_CONFIG[modelType] || MODEL_CONFIG.herald;
  const model = getModel(modelType);
  return new AIChatSimulator(systemPrompt, model, config);
};

// --- Polis utterance extraction ---

const utteranceSchema = z.object({
  utterances: z.array(z.object({
    text: z.string().describe("A single, voteable opinion statement in first person or as a clear claim. Max ~140 characters."),
  })).describe("Distinct opinion statements suitable for Agree/Disagree/Pass voting."),
});

/**
 * Distill open-text interview answers into Polis-style voteable statements.
 */
export const extractUtterancesFromTranscripts = async (
  transcripts: string[],
  surveyTitle: string,
  modelType: AIModelType = 'herald'
): Promise<string[]> => {
  const config = MODEL_CONFIG[modelType] || MODEL_CONFIG.herald;
  // Sibyl's thinking path is slower; extract with Herald for structured reliability
  const model = getModel(modelType === 'sibyl' ? 'herald' : modelType);

  const corpus = transcripts
    .map((t, i) => `--- Respondent ${i + 1} ---\n${t}`)
    .join('\n\n')
    .slice(0, 12000);

  if (!corpus.trim()) return [];

  const prompt = `Survey: "${surveyTitle}"

Below are anonymous interview answers. Extract 8–20 distinct, voteable opinion statements that capture the range of views (including minority views).

Rules:
- Each statement must be something a person can Agree, Disagree, or Pass on.
- Prefer concrete claims over vague summaries.
- Do not invent opinions not grounded in the text.
- Deduplicate near-identical ideas.
- Write statements so they stand alone without needing the survey context.

Answers:
${corpus}`;

  try {
    if (config.structuredOutputs === 'prompt-json') {
      const { text } = await generateText({
        model: getModel('herald'),
        system: 'Extract voteable opinion statements. Output ONLY JSON: {"utterances":[{"text":"..."}]}',
        prompt,
        maxRetries: 0,
      });
      const parsed = extractJson(text) as { utterances?: { text: string }[] };
      return (parsed.utterances || []).map((u) => u.text.trim()).filter(Boolean);
    }

    const { object } = await generateObject({
      model,
      schema: utteranceSchema,
      system: 'You extract Polis-style voteable statements from qualitative interview data for democratic deliberation.',
      prompt,
      maxRetries: 0,
    });

    return object.utterances.map((u) => u.text.trim()).filter(Boolean);
  } catch (error) {
    console.error('Utterance extraction failed:', error);
    throw new Error('Failed to extract utterances from responses.');
  }
};

const narrativeSchema = z.object({
  headline: z.string().describe("A short archival headline for the opinion landscape."),
  summary: z.string().describe("2–4 sentences: what the community holds in common and where it divides."),
  bridges: z.array(z.string()).describe("Up to 4 bridging claims people largely share across groups."),
  tensions: z.array(z.string()).describe("Up to 4 productive tensions / contested claims."),
});

const dataEssaySchema = z.object({
  headline: z.string().describe("Essay title, e.g. What this community holds in common."),
  lede: z.string().describe("2–3 sentence opening thesis for a data essay."),
  coexistence: z.string().describe("How bridge and tension coexist within people, not only between camps. 2–3 sentences."),
  methods: z.string().describe("1–2 sentences on how Agree/Disagree/Pass + opinion groups were interpreted."),
  bridgeEssay: z.string().describe("A short essay paragraph (3–5 sentences) on bridging consensus."),
  tensionEssay: z.string().describe("A short essay paragraph (3–5 sentences) on contested ground."),
  closing: z.string().describe("One closing takeaway paragraph."),
  bridges: z.array(z.string()).describe("Up to 4 short bridge claim labels."),
  tensions: z.array(z.string()).describe("Up to 4 short tension claim labels."),
});

/**
 * Turn Polis tallies into a readable bridging narrative (archive-style testimony, not just percentages).
 */
export const generateBridgingNarrative = async (
  surveyTitle: string,
  consensusTexts: string[],
  contestedTexts: string[],
  reasons: string[],
  modelType: AIModelType = 'herald'
): Promise<BridgingNarrative> => {
  const essay = await generateDataEssay(
    surveyTitle,
    consensusTexts,
    contestedTexts,
    reasons,
    modelType
  );
  return {
    headline: essay.headline,
    summary: essay.lede,
    bridges: essay.bridges,
    tensions: essay.tensions,
  };
};

/**
 * Anthropic-style data essay: narrative interleaved with deliberation signal.
 * Inspired by https://www.anthropic.com/features/81k-interviews
 */
export const generateDataEssay = async (
  surveyTitle: string,
  consensusTexts: string[],
  contestedTexts: string[],
  reasons: string[],
  modelType: AIModelType = 'herald',
  statsNote?: string
): Promise<DataEssay> => {
  const model = getModel(modelType === 'sibyl' || modelType === 'oracle' ? 'herald' : modelType);
  const prompt = `Deliberation title: "${surveyTitle}"
${statsNote ? `Stats: ${statsNote}` : ''}

Bridging / consensus statements:
${consensusTexts.map((t) => `- ${t}`).join('\n') || '(none yet)'}

Contested statements:
${contestedTexts.map((t) => `- ${t}`).join('\n') || '(none yet)'}

Voter reflections (why they voted):
${reasons.slice(0, 28).map((t) => `- ${t}`).join('\n') || '(none)'}

Write a data essay in the style of a large qualitative interview report:
- Lead with what people hold in common and where they divide.
- Note that bridge and tension often coexist within the same person, not only between camps.
- Stay non-partisan. Do not invent quotes or facts beyond the lists.
- Prose should be journalistic and specific, not marketing fluff.`;

  try {
    const { object } = await generateObject({
      model,
      schema: dataEssaySchema,
      system:
        'You write data essays for democratic deliberation: clear, concrete, like Anthropic’s 81k interviews feature — narrative + evidence, never hype.',
      prompt,
      maxRetries: 0,
    });
    return object;
  } catch (error) {
    console.error('Data essay failed:', error);
    return {
      headline: `What people said about ${surveyTitle}`,
      lede:
        consensusTexts.length > 0
          ? `Across votes, a bridging pattern is forming around ideas like “${consensusTexts[0]}”. Contested ground remains active — and often lives alongside agreement inside the same conversations.`
          : 'Not enough shared signal yet. As more people vote and leave reflections, a clearer essay of common ground and productive tension will emerge.',
      coexistence:
        'Bridge and tension rarely split people into neat camps. The same voter can agree on one claim and strongly contest another — holding both hope and caution at once.',
      methods:
        'Statements are voted Agree / Disagree / Pass. Opinion groups are estimated from voting patterns; consensus means similar support across groups, contested means groups pull apart.',
      bridgeEssay:
        consensusTexts.length > 0
          ? `Where groups converge, the record points to shared ground: ${consensusTexts.slice(0, 3).map((t) => `“${t}”`).join('; ')}.`
          : 'Bridging claims will surface once voting patterns stabilize across groups.',
      tensionEssay:
        contestedTexts.length > 0
          ? `Where groups diverge, the productive questions are: ${contestedTexts.slice(0, 3).map((t) => `“${t}”`).join('; ')}.`
          : 'Contested statements appear when opinion groups disagree in opposite directions.',
      closing:
        'This report is a living archive — not a final poll result. More votes and reflections will sharpen both the bridges and the tensions.',
      bridges: consensusTexts.slice(0, 4),
      tensions: contestedTexts.slice(0, 4),
    };
  }
};