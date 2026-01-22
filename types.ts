
// Define the User interface used in the authentication components.
export interface User {
  id: string;
  email: string;
  name: string;
}

export interface MoodVariation {
  mood: string;
  prompt: string;
}

export interface GroundingSource {
  title: string;
  uri: string;
  snippet?: string;
}

export interface SingerAnalysis {
  name: string;
  styleKo: string;
  styleEn: string;
  representativeSongs: string[];
  vocalTextureKo: string;
  vocalTextureEn: string;
  vocalDnaPrompt: string;
  moodVariations: MoodVariation[];
  moodTags: string[];
  sources?: GroundingSource[];
}

export interface SavedPrompt {
  id: string;
  singerName: string;
  mood: string;
  prompt: string;
  timestamp: number;
}

export interface SavedLyric {
  id: string;
  title: string;
  singerName: string | null;
  rawLyrics: string;
  structuredLyrics: string;
  timestamp: number;
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
