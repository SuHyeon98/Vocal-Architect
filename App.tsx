
import React, { useState, useEffect } from 'react';
import { analyzeSinger } from './geminiService';
import { SingerAnalysis, AppStatus, HistoryItem, SavedPrompt, SavedLyric, Folder, ScoreDraft } from './types';
import Header from './components/Header';
import SearchBar from './components/SearchBar';
import AnalysisView from './components/AnalysisView';
import AudioTranscriber from './components/AudioTranscriber';
import LoadingSpinner from './components/LoadingSpinner';
import SearchHistory from './components/SearchHistory';
import SavedPrompts from './components/SavedPrompts';
import SavedPromptsPage from './components/SavedPromptsPage';
import LyricArchitectPage from './components/LyricArchitectPage';
import ScoreArchitectPage from './components/ScoreArchitectPage';

const HISTORY_STORAGE_KEY = 'vocal_architect_history_v2';
const SAVED_PROMPTS_STORAGE_KEY = 'vocal_architect_saved_prompts_v2';
const SAVED_LYRICS_STORAGE_KEY = 'vocal_architect_saved_lyrics_v2';
const FOLDERS_STORAGE_KEY = 'vocal_architect_folders_v2';
const THEME_STORAGE_KEY = 'vocal_architect_theme';

export type ViewType = 'home' | 'lyric-editor' | 'score-architect' | 'library';

export interface LyricDraft {
  title: string;
  artistId: string;
  raw: string;
  structured: string;
}

const VIEW_ORDER: ViewType[] = ['home', 'lyric-editor', 'score-architect', 'library'];

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewType>('home');
  const [prevViewIndex, setPrevViewIndex] = useState<number>(0);
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [analysis, setAnalysis] = useState<SingerAnalysis | null>(null);
  const [activePrompts, setActivePrompts] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [savedPrompts, setSavedPrompts] = useState<SavedPrompt[]>([]);
  const [savedLyrics, setSavedLyrics] = useState<SavedLyric[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

  const [lyricDraft, setLyricDraft] = useState<LyricDraft>({
    title: '',
    artistId: '',
    raw: '',
    structured: ''
  });

  const [scoreDraft, setScoreDraft] = useState<ScoreDraft | null>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme ? savedTheme === 'dark' : prefersDark;
    setIsDarkMode(initialTheme);
    if (initialTheme) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');

    const savedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (savedHistory) setHistory(JSON.parse(savedHistory));

    const savedP = localStorage.getItem(SAVED_PROMPTS_STORAGE_KEY);
    if (savedP) setSavedPrompts(JSON.parse(savedP));

    const savedL = localStorage.getItem(SAVED_LYRICS_STORAGE_KEY);
    if (savedL) setSavedLyrics(JSON.parse(savedL));

    const savedF = localStorage.getItem(FOLDERS_STORAGE_KEY);
    if (savedF) setFolders(JSON.parse(savedF));
  }, []);

  const handleViewChange = (newView: ViewType) => {
    const currentIndex = VIEW_ORDER.indexOf(activeView);
    setPrevViewIndex(currentIndex);
    setActiveView(newView);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem(SAVED_PROMPTS_STORAGE_KEY, JSON.stringify(savedPrompts));
  }, [savedPrompts]);

  useEffect(() => {
    localStorage.setItem(SAVED_LYRICS_STORAGE_KEY, JSON.stringify(savedLyrics));
  }, [savedLyrics]);

  useEffect(() => {
    localStorage.setItem(FOLDERS_STORAGE_KEY, JSON.stringify(folders));
  }, [folders]);

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem(THEME_STORAGE_KEY, newTheme ? 'dark' : 'light');
    if (newTheme) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  };

  const handleSearch = async (name: string) => {
    if (!name.trim()) return;
    handleViewChange('home');
    setStatus(AppStatus.LOADING);
    setError(null);
    try {
      const result = await analyzeSinger(name);
      setAnalysis(result);
      setActivePrompts(result.moodVariations.map(v => v.prompt));
      
      const newHistoryItem: HistoryItem = { ...result, id: crypto.randomUUID(), timestamp: Date.now() };
      setHistory(prev => {
        const filtered = prev.filter(item => item.name.toLowerCase() !== result.name.toLowerCase());
        return [newHistoryItem, ...filtered].slice(0, 10);
      });
      setStatus(AppStatus.SUCCESS);
    } catch (err) {
      console.error(err);
      setError("가수 분석에 실패했습니다.");
      setStatus(AppStatus.ERROR);
    }
  };

  const handleSavePrompt = (singerName: string, mood: string, prompt: string, folderId?: string) => {
    const newSaved: SavedPrompt = { id: crypto.randomUUID(), singerName, mood, prompt, timestamp: Date.now(), folderId };
    setSavedPrompts(prev => [newSaved, ...prev]);
  };

  const handleUpdateSavedPrompt = (id: string, newText: string, folderId?: string) => {
    setSavedPrompts(prev => prev.map(p => p.id === id ? { ...p, prompt: newText, folderId: folderId ?? p.folderId } : p));
  };

  const handleSaveLyric = (title: string, singerName: string | null, rawLyrics: string, structuredLyrics: string, folderId?: string) => {
    const newSaved: SavedLyric = {
      id: crypto.randomUUID(),
      title,
      singerName,
      rawLyrics,
      structuredLyrics,
      timestamp: Date.now(),
      folderId
    };
    setSavedLyrics(prev => [newSaved, ...prev]);
  };

  const handleCreateFolder = (name: string, color: string) => {
    const newFolder: Folder = { id: crypto.randomUUID(), name, color, timestamp: Date.now() };
    setFolders(prev => [...prev, newFolder]);
    return newFolder.id;
  };

  const handleDeleteFolder = (id: string) => {
    if (window.confirm('폴더를 삭제하시겠습니까? 폴더 내부의 아이템들은 미분류 상태로 남습니다.')) {
      setFolders(prev => prev.filter(f => f.id !== id));
      setSavedPrompts(prev => prev.map(p => p.folderId === id ? { ...p, folderId: undefined } : p));
      setSavedLyrics(prev => prev.map(l => l.folderId === id ? { ...l, folderId: undefined } : l));
    }
  };

  const handleSelectHistory = (item: HistoryItem) => {
    setAnalysis(item);
    setActivePrompts(item.moodVariations.map(v => v.prompt));
    setStatus(AppStatus.SUCCESS);
    handleViewChange('home');
  };

  return (
    <div className="min-h-screen transition-colors duration-300">
      <Header 
        activeView={activeView} 
        onViewChange={handleViewChange} 
        savedCount={savedPrompts.length + savedLyrics.length}
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
      />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl overflow-x-hidden">
        <div key={activeView} className="animate-in fade-in duration-500 ease-out fill-mode-forwards">
          {activeView === 'library' ? (
            <SavedPromptsPage 
              prompts={savedPrompts} 
              lyrics={savedLyrics}
              folders={folders}
              onDeletePrompt={(id) => setSavedPrompts(prev => prev.filter(p => p.id !== id))}
              onDeleteLyric={(id) => setSavedLyrics(prev => prev.filter(l => l.id !== id))}
              onUpdatePrompt={handleUpdateSavedPrompt}
              onCreateFolder={handleCreateFolder}
              onDeleteFolder={handleDeleteFolder}
              onBack={() => handleViewChange('home')}
            />
          ) : activeView === 'lyric-editor' ? (
            <LyricArchitectPage 
              onBack={() => handleViewChange('home')} 
              onSaveLyric={handleSaveLyric}
              artistHistory={history}
              folders={folders}
              draft={lyricDraft}
              onDraftChange={setLyricDraft}
            />
          ) : activeView === 'score-architect' ? (
            <ScoreArchitectPage 
               onBack={() => handleViewChange('home')}
               draft={scoreDraft}
               onDraftChange={setScoreDraft}
            />
          ) : (
            <div className="space-y-12">
              <div className="mb-12">
                <SearchBar onSearch={handleSearch} isLoading={status === AppStatus.LOADING} />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8 space-y-8">
                  {status === AppStatus.LOADING && (
                    <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-softblack-card rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-xl">
                      <LoadingSpinner />
                      <p className="mt-4 text-slate-500 dark:text-zinc-400 animate-pulse">심층 데이터를 분석하는 중입니다...</p>
                    </div>
                  )}
                  {status === AppStatus.SUCCESS && analysis && (
                    <AnalysisView 
                      analysis={analysis} 
                      prompts={activePrompts} 
                      onPromptsChange={setActivePrompts}
                      onSavePrompt={handleSavePrompt}
                      folders={folders}
                      onCreateFolder={handleCreateFolder}
                    />
                  )}
                  {status === AppStatus.IDLE && (
                    <div className="flex flex-col items-center justify-center py-32 text-center">
                      <div className="w-24 h-24 bg-blue-50 dark:bg-zinc-950 rounded-full flex items-center justify-center mb-8 border border-blue-100 dark:border-white/5">
                        <svg className="w-12 h-12 text-blue-600 dark:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" /></svg>
                      </div>
                      <h2 className="text-2xl font-bold mb-2 text-slate-800 dark:text-zinc-100">분석할 가수를 입력하세요</h2>
                      <p className="text-slate-500 dark:text-zinc-400 max-w-sm mx-auto">팬 커뮤니티 평판부터 기술적 보컬 분석까지, 전문적인 Suno 프롬프트를 생성합니다.</p>
                    </div>
                  )}
                </div>
                <div className="lg:col-span-4 space-y-8">
                  <SavedPrompts prompts={savedPrompts.slice(0, 3)} onDelete={(id) => setSavedPrompts(prev => prev.filter(p => p.id !== id))} onViewMore={() => handleViewChange('library')} />
                  <SearchHistory history={history} onSelect={handleSelectHistory} onDelete={(id) => setHistory(h => h.filter(i => i.id !== id))} />
                  <AudioTranscriber />
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <footer className="py-8 border-t border-slate-200 dark:border-zinc-800 text-center text-slate-400 dark:text-zinc-600 text-sm">
        <p>© 2024 Vocal Architect • AI Powered Vocal Analysis</p>
      </footer>
    </div>
  );
};

export default App;
