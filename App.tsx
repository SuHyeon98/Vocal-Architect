
import React, { useState, useEffect } from 'react';
import { analyzeSinger } from './geminiService';
import { SingerAnalysis, AppStatus, HistoryItem } from './types';
import Header from './components/Header';
import SearchBar from './components/SearchBar';
import AnalysisView from './components/AnalysisView';
import AudioTranscriber from './components/AudioTranscriber';
import LoadingSpinner from './components/LoadingSpinner';
import SearchHistory from './components/SearchHistory';

const STORAGE_KEY = 'vocal_architect_history_v1';

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [analysis, setAnalysis] = useState<SingerAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Load history on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }
  }, []);

  // Save history when it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  }, [history]);

  const handleSearch = async (name: string) => {
    if (!name.trim()) return;
    
    setStatus(AppStatus.LOADING);
    setError(null);
    
    try {
      const result = await analyzeSinger(name);
      setAnalysis(result);
      
      // Update history: Add new item to the top, limit to 10 items
      const newHistoryItem: HistoryItem = {
        ...result,
        id: crypto.randomUUID(),
        timestamp: Date.now()
      };
      
      setHistory(prev => {
        const filtered = prev.filter(item => item.name.toLowerCase() !== result.name.toLowerCase());
        return [newHistoryItem, ...filtered].slice(0, 10);
      });
      
      setStatus(AppStatus.SUCCESS);
    } catch (err) {
      console.error(err);
      setError("가수 분석에 실패했습니다. 이름을 다시 확인하거나 잠시 후 시도해주세요.");
      setStatus(AppStatus.ERROR);
    }
  };

  const handleSelectHistory = (item: HistoryItem) => {
    setAnalysis(item);
    setStatus(AppStatus.SUCCESS);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteHistory = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-12">
          <SearchBar onSearch={handleSearch} isLoading={status === AppStatus.LOADING} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content: Analysis Result (8 cols) */}
          <div className="lg:col-span-8 space-y-8">
            {status === AppStatus.LOADING && (
              <div className="flex flex-col items-center justify-center py-20 bg-slate-800/30 rounded-3xl border border-slate-700/50 backdrop-blur-sm">
                <LoadingSpinner />
                <p className="mt-4 text-slate-400 animate-pulse">음악 데이터를 분석하는 중입니다...</p>
              </div>
            )}

            {status === AppStatus.ERROR && (
              <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400">
                {error}
              </div>
            )}

            {status === AppStatus.SUCCESS && analysis && (
              <AnalysisView analysis={analysis} />
            )}

            {status === AppStatus.IDLE && (
              <div className="flex flex-col items-center justify-center py-32 text-center">
                <div className="w-20 h-20 bg-blue-600/20 rounded-full flex items-center justify-center mb-6">
                  <svg className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold mb-2">분석할 가수를 입력하세요</h2>
                <p className="text-slate-400 max-w-md">가수의 보컬 DNA를 분석하여 Suno AI를 위한 완벽한 스타일 프롬프트를 생성해드립니다.</p>
              </div>
            )}
          </div>

          {/* Sidebar: History and Tools (4 cols) */}
          <div className="lg:col-span-4 space-y-8">
            <SearchHistory 
              history={history} 
              onSelect={handleSelectHistory} 
              onDelete={handleDeleteHistory} 
            />
            
            <AudioTranscriber />
            
            <div className="p-6 bg-slate-800/40 rounded-3xl border border-slate-700/50">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Suno AI 활용 팁
              </h3>
              <ul className="space-y-3 text-sm text-slate-400">
                <li className="flex gap-2">
                  <span className="text-yellow-500">•</span>
                  장르 태그(K-Pop, 90s R&B 등)를 구체적으로 사용하세요.
                </li>
                <li className="flex gap-2">
                  <span className="text-yellow-500">•</span>
                  airy, raspy, powerful 같은 보컬 묘사가 큰 차이를 만듭니다.
                </li>
                <li className="flex gap-2">
                  <span className="text-yellow-500">•</span>
                  무드 태그는 템포와 악기 구성을 정의하는 데 도움이 됩니다.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-6 border-t border-slate-800/50 text-center text-slate-500 text-sm">
        Gemini 3를 활용한 AI 기반 음악 분석 도구
      </footer>
    </div>
  );
};

export default App;
