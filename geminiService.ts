
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { SingerAnalysis } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const analyzeSinger = async (singerName: string): Promise<SingerAnalysis> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `가수 "${singerName}"에 대해 아주 구체적이고 전문적으로 분석해주세요. 
    1. 가수의 주요 음악 스타일(style)과 목소리 특징(vocalTexture)을 전문가적인 관점에서 최소 2~3문장 이상의 상세한 설명을 제공하세요.
    2. 분석 내용은 반드시 '한국어 버전'과 '영어 버전'을 각각 분리하여 작성해주세요. 
    3. 대표곡 리스트를 포함해주세요.
    4. Suno AI v3.5에서 사용할 수 있는 다음 3가지 'Style' 프롬프트를 영어 태그 조합으로 작성하세요:
       - '신나는 댄스곡' 버전
       - '감성적인 발라드' 버전
       - '몽환적인 분위기' 버전
    각 프롬프트는 가수의 보컬 특징을 극대화할 수 있도록 장르, 무드, 보컬 질감 태그를 정교하게 조합하세요.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          styleKo: { type: Type.STRING, description: "상세한 음악 스타일 분석 (한국어)" },
          styleEn: { type: Type.STRING, description: "Detailed musical style analysis (English)" },
          representativeSongs: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING } 
          },
          vocalTextureKo: { type: Type.STRING, description: "상세한 보컬 질감 및 테크닉 분석 (한국어)" },
          vocalTextureEn: { type: Type.STRING, description: "Detailed vocal texture and technique analysis (English)" },
          moodVariations: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                mood: { type: Type.STRING, description: "분위기 명칭" },
                prompt: { type: Type.STRING, description: "Suno AI용 스타일 태그 조합" }
              },
              required: ["mood", "prompt"]
            }
          },
          moodTags: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING } 
          },
        },
        required: ["name", "styleKo", "styleEn", "representativeSongs", "vocalTextureKo", "vocalTextureEn", "moodVariations", "moodTags"]
      }
    }
  });

  if (!response.text) throw new Error("No response from Gemini");
  return JSON.parse(response.text.trim()) as SingerAnalysis;
};

export const transcribeAudio = async (base64Audio: string): Promise<string> => {
  const response: GenerateContentResponse = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: 'audio/wav',
            data: base64Audio,
          },
        },
        { text: "이 오디오를 정확하게 받아쓰기 해주세요. 노래라면 가사를 적어주세요." }
      ]
    }
  });

  return response.text || "받아쓰기 결과가 없습니다.";
};
