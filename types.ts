
export interface MoodVariation {
  mood: string;
  prompt: string;
}

export interface GroundingSource {
  title: string;
  uri: string;
  snippet?: string;
}

export interface RepresentativeSong {
  title: string;
  url: string;
}

export interface SingerAnalysis {
  name: string;
  styleKo: string;
  styleEn: string;
  representativeSongs: RepresentativeSong[];
  vocalTextureKo: string;
  vocalTextureEn: string;
  vocalDnaPrompt: string;
  moodVariations: MoodVariation[];
  moodTags: string[];
  sources?: GroundingSource[];
}

export interface Folder {
  id: string;
  name: string;
  color: string;
  timestamp: number;
}

export interface SavedPrompt {
  id: string;
  singerName: string;
  mood: string;
  prompt: string;
  timestamp: number;
  folderId?: string;
}

export interface SavedLyric {
  id: string;
  title: string;
  singerName: string | null;
  rawLyrics: string;
  structuredLyrics: string;
  timestamp: number;
  folderId?: string;
}

export interface HistoryItem extends SingerAnalysis {
  id: string;
  timestamp: number;
}

export interface TranscriptionResult {
  text: string;
  status: 'idle' | 'recording' | 'processing' | 'success' | 'error';
}

export interface ScoreDraft {
  fileName: string;
  abcNotation: string;
  analysis: string;
}

export enum AppStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export interface User {
  id: string;
  email: string;
  name: string;
}
