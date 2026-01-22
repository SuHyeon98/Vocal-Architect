
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
    - 해당 가수가 실제로 사용하는 발성법(진성, 가성, 믹스보이스 등)과 고유한 음색의 질감을 매우 구체적이고 전문적인 음악 용어를 사용하여 서술하세요.
    - 대중과 전문가들이 공통적으로 언급하는 가수의 음악적 정체성과 창법의 특징적인 습관(버릇)을 분석하세요.
    - 'moodVariations'는 최대 6개까지만 생성하세요.
    - 'vocalDnaPrompt' 작성 시: 가수의 이름 등 고유 명사를 절대 포함하지 말고, 오직 목소리의 물리적 특성, 배음, 질감, 선호하는 리버브/컴프레션 스타일만을 영문 태그로 나열하세요.
    
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
          representativeSongs: { type: Type.ARRAY, items: { type: Type.STRING }, description: "상징적인 대표곡 리스트" },
          vocalTextureKo: { type: Type.STRING, description: "전문적인 보컬 테크닉 및 질감 분석 (한국어)" },
          vocalTextureEn: { type: Type.STRING, description: "Detailed vocal texture analysis (English)" },
          vocalDnaPrompt: { type: Type.STRING, description: "Suno AI Style용 고품질 보컬 태그 (영문)" },
          moodVariations: {
            type: Type.ARRAY,
            maxItems: 6,
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
  const metadata = response.candidates?.[0]?.groundingMetadata;
  
  if (metadata?.groundingChunks) {
    metadata.groundingChunks.forEach((chunk: any) => {
      if (chunk.web?.uri) {
        sources.push({
          title: chunk.web.title || "참고 자료",
          uri: chunk.web.uri,
          snippet: chunk.text // Using the chunk text as a snippet/summary
        });
      }
    });
  }
  
  // Deduplicate and filter sources
  analysis.sources = sources.reduce((acc: GroundingSource[], current) => {
    const x = acc.find(item => item.uri === current.uri);
    if (!x) {
      return acc.concat([current]);
    } else {
      return acc;
    }
  }, []);

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
    
    CRITICAL INSTRUCTION (STRICTLY OBSERVE):
    1. DO NOT CHANGE, EDIT, REWORD, OR DELETE ANY WORDS from the original lyrics provided above. 
    2. Every single character, space, and punctuation mark of the user's raw lyrics must remain exactly as they are.
    3. YOUR ONLY JOB is to wrap or separate the existing lines with Suno AI metatags (e.g., [Intro], [Verse 1], [Chorus], [Verse 2], [Bridge], [Outro], [Outro/Fade Out]).
    4. Place tags on their own lines.
    5. If an Artist Reference is provided, arrange the metatags to reflect that specific artist's typical song structure and emotional pacing.
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
