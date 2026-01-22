
export interface MoodVariation {
  mood: string;
  prompt: string;
}

export interface SingerAnalysis {
  name: string;
  styleKo: string;
  styleEn: string;
  representativeSongs: string[];
  vocalTextureKo: string;
  vocalTextureEn: string;
  moodVariations: MoodVariation[];
  moodTags: string[];
}

export interface HistoryItem extends SingerAnalysis {
  id: string;
  timestamp: number;
}

export interface TranscriptionResult {
  text: string;
  status: 'idle' | 'recording' | 'processing' | 'success' | 'error';
}

export enum AppStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}
