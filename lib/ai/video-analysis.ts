import { GoogleGenAI } from "@google/genai";
import type { VideoAnalysis } from "@/lib/ai/video-analysis-types";

const videoAnalysisSchema = {
  type: "object",
  properties: {
    summary: { type: "string" },
    tone: { type: "string" },
    captions: { type: "array", items: { type: "string" }, minItems: 5, maxItems: 5 },
    hooks: { type: "array", items: { type: "string" }, minItems: 5, maxItems: 5 },
    titles: { type: "array", items: { type: "string" }, minItems: 5, maxItems: 5 },
    hashtags: { type: "array", items: { type: "string" }, minItems: 2 },
    description: { type: "string" },
    score: {
      type: "object",
      properties: {
        overall: { type: "integer", minimum: 0, maximum: 100 },
        hook: { type: "integer", minimum: 0, maximum: 100 },
        engagement: { type: "integer", minimum: 0, maximum: 100 },
        clarity: { type: "integer", minimum: 0, maximum: 100 },
        shareability: { type: "integer", minimum: 0, maximum: 100 },
      },
      required: ["overall", "hook", "engagement", "clarity", "shareability"],
    },
    suggestions: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 3 },
  },
  required: ["summary", "tone", "captions", "hooks", "titles", "hashtags", "description", "score", "suggestions"],
};

function isVideoAnalysis(value: unknown): value is VideoAnalysis {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<VideoAnalysis>;
  return typeof candidate.summary === "string" && typeof candidate.tone === "string" && Array.isArray(candidate.captions) && candidate.captions.length === 5 && Array.isArray(candidate.hooks) && candidate.hooks.length === 5 && Array.isArray(candidate.titles) && candidate.titles.length === 5 && Array.isArray(candidate.hashtags) && candidate.hashtags.length >= 2 && typeof candidate.description === "string" && Array.isArray(candidate.suggestions) && candidate.suggestions.length === 3 && Boolean(candidate.score) && typeof candidate.score?.overall === "number";
}

async function waitForVideoProcessing(ai: GoogleGenAI, name: string) {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const file = await ai.files.get({ name });
    if (file.state === "ACTIVE") return file;
    if (file.state === "FAILED") throw new Error("Gemini could not process the uploaded video.");
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error("Gemini took too long to process the uploaded video.");
}

export async function analyzeVideoWithProvider(video: Blob, filename: string): Promise<VideoAnalysis> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured on the server.");

  const ai = new GoogleGenAI({ apiKey });
  const uploaded = await ai.files.upload({ file: video, config: { mimeType: video.type, displayName: filename } });
  if (!uploaded.name || !uploaded.uri) throw new Error("Gemini did not return a usable uploaded video.");

  try {
    const processed = await waitForVideoProcessing(ai, uploaded.name);
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: [{ role: "user", parts: [{ fileData: { fileUri: processed.uri || uploaded.uri, mimeType: processed.mimeType || video.type } }, { text: `Analyze this uploaded video for a social media creator. Base every suggestion on the actual visible and audible content, tone, topic, and notable moments. Do not invent facts that are not present. Captions must suit Instagram Reels. Titles must suit YouTube Shorts. Hooks must be short and attention-grabbing. Hashtags must be relevant to the actual content. Do not guarantee virality. Return only the requested JSON object.` }] }],
      config: { responseMimeType: "application/json", responseJsonSchema: videoAnalysisSchema, temperature: 0.7 },
    });

    const text = response.text?.trim();
    if (!text) throw new Error("Gemini returned an empty analysis.");
    let parsed: unknown;
    try { parsed = JSON.parse(text); } catch { throw new Error("Gemini returned invalid analysis JSON."); }
    if (!isVideoAnalysis(parsed)) throw new Error("Gemini returned an incomplete analysis.");
    return parsed;
  } finally {
    await ai.files.delete({ name: uploaded.name }).catch(() => undefined);
  }
}
