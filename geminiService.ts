
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { SingerAnalysis, GroundingSource } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const analyzeSinger = async (singerName: string): Promise<SingerAnalysis> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `가수 또는 우타이테 "${singerName}"에 대해 다음의 출처들을 최우선으로 검색하고 종합하여 가장 정확하고 전문적으로 분석해주세요:
    1. 나무위키 (상세 프로필, 창법 변화, 음반 목록)
    2. 유튜브 (라이브 가창력 분석, 보컬 테크닉 리뷰, 활동 영상)
    3. 각종 음악 플랫폼 및 커뮤니티 (Melon, Spotify, Genie 등 장르 통계 및 대중적 평가)
    
    분석 가이드라인:
    - 해당 가수가 실제로 사용하는 발성법(진성, 가성, 믹스보이스 등)과 고유한 음색의 질감을 구체적으로 서술하세요.
    - 대중과 전문가들이 공통적으로 언급하는 가수의 음악적 정체성을 반영하세요.
    - 'vocalDnaPrompt' 작성 시: 가수의 이름 등 고유 명사를 절대 포함하지 말고, 오직 목소리의 물리적 특성과 선호하는 사운드 스타일만을 영문 태그로 나열하세요.
    
    결과는 반드시 JSON 형식을 따르세요.`,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          styleKo: { type: Type.STRING, description: "나무위키와 플랫폼 데이터를 기반으로 한 상세 음악 스타일 분석 (한국어)" },
          styleEn: { type: Type.STRING, description: "Detailed musical style analysis (English)" },
          representativeSongs: { type: Type.ARRAY, items: { type: Type.STRING }, description: "가장 대중적이고 상징적인 대표곡 리스트" },
          vocalTextureKo: { type: Type.STRING, description: "전문적인 보컬 테크닉 및 질감 분석 (한국어)" },
          vocalTextureEn: { type: Type.STRING, description: "Detailed vocal texture and technique analysis (English)" },
          vocalDnaPrompt: { type: Type.STRING, description: "Suno AI Style 입력용 고품질 보컬 태그 (영문)" },
          moodVariations: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                mood: { type: Type.STRING },
                prompt: { type: Type.STRING }
              },
              required: ["mood", "prompt"]
            }
          },
          moodTags: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ["name", "styleKo", "styleEn", "representativeSongs", "vocalTextureKo", "vocalTextureEn", "vocalDnaPrompt", "moodVariations", "moodTags"]
      }
    }
  });

  if (!response.text) throw new Error("No response from Gemini");
  const analysis = JSON.parse(response.text.trim()) as SingerAnalysis;
  const sources: GroundingSource[] = [];
  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
  if (groundingChunks) {
    groundingChunks.forEach((chunk: any) => {
      if (chunk.web?.uri && chunk.web?.title) {
        sources.push({ title: chunk.web.title, uri: chunk.web.uri });
      }
    });
  }
  analysis.sources = sources.filter((v, i, a) => a.findIndex(t => t.uri === v.uri) === i);
  return analysis;
};

export const refinePrompt = async (singerName: string, vocalTexture: string, currentPrompt: string, instruction?: string): Promise<string> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Singer: ${singerName}\nVocal DNA Context: ${vocalTexture}\nCurrent Style Prompt: ${currentPrompt}\n${instruction ? `Request: ${instruction}` : ''}\n\nTask: Refine the Suno AI style tags to be more evocative and accurate. Return ONLY the comma-separated English tags.`,
  });
  return response.text?.trim() || currentPrompt;
};

export const generateSongSpecificPrompt = async (singerName: string, vocalTexture: string, moodPrompt: string, songTitle: string): Promise<string> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Singer: ${singerName}\nVocal Texture: ${vocalTexture}\nBase Style: ${moodPrompt}\nTarget Reference Song: ${songTitle}\n\nTask: Create a Suno style prompt that specifically replicates the arrangement and atmosphere of "${songTitle}". Return ONLY tags.`,
  });
  return response.text?.trim() || moodPrompt;
};

export const structureLyrics = async (rawLyrics: string, artistContext?: { name: string; style: string; texture: string }): Promise<string> => {
  const prompt = `
    User's Raw Lyrics:
    ${rawLyrics}
    
    ${artistContext ? `Artist Reference: ${artistContext.name}\nMusical Background: ${artistContext.style}\nVocal Style: ${artistContext.texture}` : ''}

    Task: Structure these lyrics for Suno AI (v3.5+). 
    
    CRITICAL INSTRUCTION:
    1. DO NOT CHANGE, EDIT, OR DELETE ANY WORDS from the original lyrics. 
    2. Every single character of the user's input must remain intact and in its original order.
    3. YOUR ONLY JOB is to insert Suno AI metatags (e.g., [Intro], [Verse 1], [Chorus], [Verse 2], [Bridge], [Outro], [Outro/Fade Out]) at the appropriate points between the lyric lines.
    4. If an Artist Reference is provided, arrange the metatags to reflect that artist's typical song structure and emotional pacing.
    5. You may also add performance cues in square brackets (e.g., [Emotional Piano Solo], [Powerful Vocal]) between sections, but NEVER modify the lyrics themselves.
    6. Return ONLY the structured output.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
  });
  return response.text?.trim() || rawLyrics;
};

export const transcribeAudio = async (base64Audio: string): Promise<string> => {
  const response: GenerateContentResponse = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { mimeType: 'audio/wav', data: base64Audio } },
        { text: "이 오디오에서 들리는 가사나 대화를 정확하게 텍스트로 변환해주세요." }
      ]
    }
  });
  return response.text || "";
};
