
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { SingerAnalysis, GroundingSource } from "./types";

// Always initialize the client using the exact named parameter from process.env.API_KEY.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeSinger = async (singerName: string): Promise<SingerAnalysis> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `가수 또는 우타이테 "${singerName}"에 대해 다음의 출처들을 종합하여 가장 정확하고 전문적으로 분석해주세요:
    1. 나무위키 (상세 프로필, 창법 변화, 음반 목록)
    2. 유튜브 (전문 보컬 트레이너들의 라이브 가창력 분석, 보컬 테크닉 리뷰)
    3. 국내외 주요 음악 커뮤니티 (디시인사이드 가창력 갤러리, 더쿠, Reddit, Fandom Wiki 등 팬덤의 기술적 데이터)
    
    분석 가이드라인:
    - 해당 가수가 실제로 사용하는 발성법과 고유한 음색의 질감을 매우 구체적이고 전문적인 음악 용어를 사용하여 서술하세요.
    - 'styleKo'와 'vocalTextureKo'는 상세한 한국어 설명을, 'styleEn'과 'vocalTextureEn'은 그에 대응하는 전문적인 영문 설명을 작성하세요.
    - 'moodVariations'의 'mood' 제목은 반드시 한국어로 작성하세요.
    - 'moodTags'는 가수를 상징하는 핵심 키워드 6개를 생성하세요.
    - 'vocalDnaPrompt' 작성 시: 목소리의 물리적 특성, 배음, 질감만을 영문 태그로 나열하세요.
    - 'representativeSongs': 구글 검색을 통해 "${singerName}"의 실제 공식 유튜브 뮤직비디오나 라이브 영상 URL을 찾아 3-5개 포함하세요. URL은 반드시 유효한 유튜브 주소여야 합니다.
    
    결과는 반드시 JSON 형식을 따르세요.`,
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
                url: { type: Type.STRING }
              },
              required: ["title", "url"]
            } 
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

  const text = response.text;
  if (!text) throw new Error("No response from Gemini");
  const analysis = JSON.parse(text.trim()) as SingerAnalysis;
  
  const sources: GroundingSource[] = [];
  const metadata = response.candidates?.[0]?.groundingMetadata;
  
  if (metadata?.groundingChunks) {
    metadata.groundingChunks.forEach((chunk: any) => {
      if (chunk.web?.uri) {
        sources.push({
          title: chunk.web.title || "참고 자료",
          uri: chunk.web.uri,
          snippet: chunk.text 
        });
      }
    });
  }
  
  analysis.sources = sources.reduce((acc: GroundingSource[], current) => {
    const x = acc.find(item => item.uri === current.uri);
    if (!x) return acc.concat([current]);
    return acc;
  }, []);

  return analysis;
};

export const refinePrompt = async (singerName: string, vocalTexture: string, currentPrompt: string, instruction?: string): Promise<string> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Singer: ${singerName}\nVocal DNA Context: ${vocalTexture}\nCurrent Style Prompt: ${currentPrompt}\n${instruction ? `User Refinement Goal: ${instruction}` : ''}\n\nTask: Refine the Suno AI style tags to be more evocative and musically accurate. Return ONLY the comma-separated English tags.`,
  });
  return response.text?.trim() || currentPrompt;
};

export const generateSongSpecificPrompt = async (singerName: string, vocalTexture: string, moodPrompt: string, songTitle: string): Promise<string> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Singer: ${singerName}\nVocal Texture: ${vocalTexture}\nBase Style: ${moodPrompt}\nTarget Reference Song: ${songTitle}\n\nTask: Create a Suno style prompt that specifically replicates the arrangement of "${songTitle}". Return ONLY tags.`,
  });
  return response.text?.trim() || moodPrompt;
};

export const structureLyrics = async (rawLyrics: string, artistContext?: { name: string; style: string; texture: string }): Promise<string> => {
  const prompt = `
    User's Raw Lyrics:
    ${rawLyrics}
    ${artistContext ? `Artist Reference: ${artistContext.name}\nMusical Background: ${artistContext.style}\nVocal Style: ${artistContext.texture}` : ''}
    Task: Structure these lyrics for Suno AI (v3.5+). Wrap existing lines with Suno AI metatags. Return ONLY the structured output.`;

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

export const generateScoreFromAudio = async (base64Audio: string, mimeType: string): Promise<{ abc: string; analysis: string }> => {
  const prompt = `
    Analyze this audio file and transcribe it into musical notation.
    1. Identify the key and tempo (BPM).
    2. Extract the main melody and chords.
    3. Convert the transcription into standard ABC Notation (ABC format).
    4. Provide a brief musical analysis of the track IN KOREAN (한국어로 작성해주세요).

    Return the result in JSON format with 'abc' (the string containing the ABC notation) and 'analysis' (a string describing the musical features in Korean).
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { mimeType: mimeType, data: base64Audio } },
        { text: prompt }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          abc: { type: Type.STRING },
          analysis: { type: Type.STRING }
        },
        required: ["abc", "analysis"]
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("Could not analyze audio for score.");
  return JSON.parse(text.trim());
};
