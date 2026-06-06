import { GroundingSource, SingerAnalysis } from "./types";

export const GEMINI_API_KEY_MISSING_MESSAGE =
  "Google API Key가 설정되지 않았습니다. .env 파일에 VITE_GEMINI_API_KEY를 추가해 주세요.";

export const GEMINI_LYRICS_API_KEY_MISSING_MESSAGE =
  "Google API Key가 설정되지 않아 AI 작사 생성은 사용할 수 없습니다.\n.env.local에 VITE_GEMINI_API_KEY를 추가해 주세요.";

export class GeminiApiKeyMissingError extends Error {
  constructor() {
    super(GEMINI_API_KEY_MISSING_MESSAGE);
    this.name = "GeminiApiKeyMissingError";
  }
}

export const isGeminiApiKeyMissingError = (error: unknown): error is GeminiApiKeyMissingError => {
  return error instanceof GeminiApiKeyMissingError;
};

const getGeminiClient = async () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new GeminiApiKeyMissingError();
  }

  const { GoogleGenAI } = await import("@google/genai");
  return new GoogleGenAI({ apiKey });
};

const getGeminiClientWithType = async () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new GeminiApiKeyMissingError();
  }

  const { GoogleGenAI, Type } = await import("@google/genai");
  return { ai: new GoogleGenAI({ apiKey }), Type };
};

interface WebGroundingChunk {
  web?: {
    title?: string;
    uri?: string;
  };
  text?: string;
}

interface GroundingMetadata {
  groundingChunks?: WebGroundingChunk[];
}

interface CandidateWithGrounding {
  groundingMetadata?: GroundingMetadata;
}

export interface GenerateLyricsInput {
  title: string;
  genre: string;
  mood: string;
  keywords: string;
  referenceArtist: string;
  sections: string[];
}

export const analyzeSinger = async (singerName: string): Promise<SingerAnalysis> => {
  const { ai, Type } = await getGeminiClientWithType();
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: `가수 또는 우타이테 "${singerName}"에 대해 공개 자료를 종합해 전문적으로 분석해 주세요.

분석 요구사항:
- 실제 보컬 톤, 발성, 질감, 장르적 특징을 구체적으로 설명
- styleKo, vocalTextureKo는 한국어로 작성
- styleEn, vocalTextureEn, vocalDnaPrompt는 Suno 스타일 태그로 활용 가능한 영어 표현으로 작성
- moodVariations는 한국어 mood와 영어 prompt를 포함
- moodTags는 6개 이내의 한국어 태그
- representativeSongs는 참고할 대표곡 3-5개와 URL 포함

결과는 반드시 지정된 JSON schema만 반환해 주세요.`,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          styleKo: { type: Type.STRING },
          styleEn: { type: Type.STRING },
          representativeSongs: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                url: { type: Type.STRING },
              },
              required: ["title", "url"],
            },
          },
          vocalTextureKo: { type: Type.STRING },
          vocalTextureEn: { type: Type.STRING },
          vocalDnaPrompt: { type: Type.STRING },
          moodVariations: {
            type: Type.ARRAY,
            maxItems: 6,
            items: {
              type: Type.OBJECT,
              properties: {
                mood: { type: Type.STRING },
                prompt: { type: Type.STRING },
              },
              required: ["mood", "prompt"],
            },
          },
          moodTags: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: [
          "name",
          "styleKo",
          "styleEn",
          "representativeSongs",
          "vocalTextureKo",
          "vocalTextureEn",
          "vocalDnaPrompt",
          "moodVariations",
          "moodTags",
        ],
      },
    },
  });

  const text = response.text;
  if (!text) throw new Error("No response from Gemini");

  const analysis = JSON.parse(text.trim()) as SingerAnalysis;
  const candidate = response.candidates?.[0] as CandidateWithGrounding | undefined;
  const groundingChunks = candidate?.groundingMetadata?.groundingChunks ?? [];

  const sources: GroundingSource[] = groundingChunks
    .filter((chunk): chunk is WebGroundingChunk & { web: { uri: string; title?: string } } => Boolean(chunk.web?.uri))
    .map((chunk) => ({
      title: chunk.web.title || "참고 자료",
      uri: chunk.web.uri,
      snippet: chunk.text,
    }));

  analysis.sources = sources.reduce((acc: GroundingSource[], current) => {
    return acc.some((item) => item.uri === current.uri) ? acc : acc.concat(current);
  }, []);

  return analysis;
};

export const refinePrompt = async (
  singerName: string,
  vocalTexture: string,
  currentPrompt: string,
  instruction?: string,
): Promise<string> => {
  const ai = await getGeminiClient();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Singer: ${singerName}
Vocal DNA Context: ${vocalTexture}
Current Style Prompt: ${currentPrompt}
${instruction ? `User Refinement Goal: ${instruction}` : ""}

Task: Refine the Suno AI style tags to be more evocative and musically accurate. Return ONLY the comma-separated English tags.`,
  });

  return response.text?.trim() || currentPrompt;
};

export const generateSongSpecificPrompt = async (
  singerName: string,
  vocalTexture: string,
  moodPrompt: string,
  songTitle: string,
): Promise<string> => {
  const ai = await getGeminiClient();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Singer: ${singerName}
Vocal Texture: ${vocalTexture}
Base Style: ${moodPrompt}
Target Reference Song: ${songTitle}

Task: Create a Suno style prompt that specifically replicates the arrangement of "${songTitle}". Return ONLY tags.`,
  });

  return response.text?.trim() || moodPrompt;
};

export const structureLyrics = async (
  rawLyrics: string,
  artistContext?: { name: string; style: string; texture: string },
): Promise<string> => {
  const ai = await getGeminiClient();
  const prompt = `User's Raw Lyrics:
${rawLyrics}

${artistContext ? `Artist Reference: ${artistContext.name}\nMusical Background: ${artistContext.style}\nVocal Style: ${artistContext.texture}` : ""}

Task: Structure these lyrics for Suno AI. Wrap existing lines with Suno metatags. Return ONLY the structured lyrics.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
  });

  return response.text?.trim() || rawLyrics;
};

export const generateLyrics = async (input: GenerateLyricsInput): Promise<string> => {
  try {
    const ai = await getGeminiClient();
    const sections = input.sections.length > 0 ? input.sections.join(", ") : "Verse, Chorus";
    const prompt = `전문 한국어 작사가처럼 아래 조건에 맞는 완성형 가사를 작성해 주세요.

곡 제목: ${input.title || "무제"}
장르: ${input.genre}
분위기/주제: ${input.mood}
키워드: ${input.keywords || "없음"}
참고 아티스트: ${input.referenceArtist || "없음"}
곡 구조: ${sections}

작성 규칙:
- 결과는 가사 본문만 반환
- 선택된 구조는 [Verse], [Pre-Chorus], [Chorus], [Bridge], [Final Chorus] 형식으로 표시
- 기존 곡의 가사를 복사하지 말 것
- 한국어로 자연스럽고 부를 수 있는 문장으로 작성
- 후렴은 기억하기 쉬운 훅을 포함
- 각 섹션은 실사용 가능한 길이로 간결하게 작성`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    return response.text?.trim() || "";
  } catch (error) {
    if (isGeminiApiKeyMissingError(error)) {
      throw new Error(GEMINI_LYRICS_API_KEY_MISSING_MESSAGE);
    }
    throw error;
  }
};

export const transcribeAudio = async (base64Audio: string): Promise<string> => {
  const ai = await getGeminiClient();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: {
      parts: [
        { inlineData: { mimeType: "audio/wav", data: base64Audio } },
        { text: "오디오에 포함된 보컬 또는 멜로디를 가능한 정확하게 텍스트로 전사해 주세요." },
      ],
    },
  });

  return response.text || "";
};

export const generateScoreFromAudio = async (
  base64Audio: string,
  mimeType: string,
): Promise<{ abc: string; analysis: string }> => {
  const { ai, Type } = await getGeminiClientWithType();
  const prompt = `Analyze this audio file and transcribe it into musical notation.
1. Identify the key and tempo (BPM).
2. Extract the main melody and chords.
3. Convert the transcription into standard ABC Notation.
4. Provide a brief musical analysis in Korean.

Return JSON with 'abc' and 'analysis'.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: {
      parts: [
        { inlineData: { mimeType, data: base64Audio } },
        { text: prompt },
      ],
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          abc: { type: Type.STRING },
          analysis: { type: Type.STRING },
        },
        required: ["abc", "analysis"],
      },
    },
  });

  const text = response.text;
  if (!text) throw new Error("Could not analyze audio for score.");
  return JSON.parse(text.trim()) as { abc: string; analysis: string };
};
