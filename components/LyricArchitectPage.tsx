
import React, { useState } from 'react';
import { structureLyrics } from '../geminiService';
import { HistoryItem } from '../types';
import { LyricDraft } from '../App';
import LoadingSpinner from './LoadingSpinner';

interface LyricArchitectPageProps {
  onBack: () => void;
  onSaveLyric: (title: string, singerName: string | null, raw: string, structured: string) => void;
  artistHistory: HistoryItem[];
  draft: LyricDraft;
  onDraftChange: (draft: LyricDraft) => void;
}

const LyricArchitectPage: React.FC<LyricArchitectPageProps> = ({ 
  onBack, 
  onSaveLyric, 
  artistHistory,
  draft,
  onDraftChange 
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const updateDraft = (updates: Partial<LyricDraft>) => {
    onDraftChange({ ...draft, ...updates });
  };

  const handleStructure = async () => {
    if (!draft.raw.trim() || isLoading) return;

    setIsLoading(true);
    try {
      const selectedArtist = artistHistory.find(a => a.id === draft.artistId);
      const artistContext = selectedArtist ? {
        name: selectedArtist.name,
        style: selectedArtist.styleKo,
        texture: selectedArtist.vocalTextureKo
      } : undefined;

      const result = await structureLyrics(draft.raw, artistContext);
      updateDraft({ structured: result });
    } catch (err) {
      console.error(err);
      alert("가사 구조화 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    if (!draft.structured.trim()) return;
    const title = draft.title.trim() || '무제 가사';
    const selectedArtist = artistHistory.find(a => a.id === draft.artistId);
    onSaveLyric(title, selectedArtist?.name || null, draft.raw, draft.structured);
    alert('가사가 내 저장소에 저장되었습니다!');
  };

  const clearAll = () => {
    if (window.confirm('모든 내용을 초기화하시겠습니까?')) {
      onDraftChange({
        title: '',
        artistId: '',
        raw: '',
        structured: ''
      });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors text-sm font-bold">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          홈으로 돌아가기
        </button>
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">Lyric Architect</h2>
          <button 
            onClick={clearAll}
            className="text-xs text-slate-400 hover:text-red-500 transition-colors flex items-center gap-1 font-bold"
          >
            전체 초기화
          </button>
        </div>
      </div>

      <div className="p-6 bg-white dark:bg-slate-800/40 rounded-3xl border border-slate-200 dark:border-slate-700/50 space-y-6 shadow-xl dark:shadow-none">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-2">가사 제목</label>
            <input 
              type="text" 
              value={draft.title}
              onChange={(e) => updateDraft({ title: e.target.value })}
              placeholder="가사의 제목을 입력하세요..."
              className="w-full bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/50 rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-2">아티스트 스타일 적용</label>
            <select 
              value={draft.artistId}
              onChange={(e) => updateDraft({ artistId: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/50 rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            >
              <option value="">적용 안 함 (일반 구조화)</option>
              {artistHistory.map(artist => (
                <option key={artist.id} value={artist.id}>{artist.name} 스타일</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase px-1">원문 가사</label>
          <textarea
            value={draft.raw}
            onChange={(e) => updateDraft({ raw: e.target.value })}
            placeholder="여기에 가사 원고를 입력하세요..."
            className="w-full h-[500px] bg-white dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700/50 rounded-3xl p-6 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all resize-none shadow-xl dark:shadow-none font-medium leading-relaxed"
          />
          <button
            onClick={handleStructure}
            disabled={!draft.raw.trim() || isLoading}
            className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-lg shadow-indigo-600/30"
          >
            {isLoading ? <LoadingSpinner size="sm" /> : 'Suno AI용 구조화 시작'}
          </button>
        </div>

        <div className="space-y-4">
          <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase px-1">구조화된 결과</label>
          <div className={`w-full h-[500px] bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-slate-700/50 rounded-3xl p-6 text-indigo-700 dark:text-blue-300 font-mono text-sm leading-relaxed overflow-y-auto whitespace-pre-wrap shadow-inner ${!draft.structured && 'flex items-center justify-center text-slate-400'}`}>
            {draft.structured || "버튼을 누르면 구조화된 가사가 나타납니다."}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => {
                navigator.clipboard.writeText(draft.structured);
                alert('복사되었습니다!');
              }}
              disabled={!draft.structured}
              className="py-4 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 disabled:opacity-50 text-white rounded-2xl font-bold transition-all shadow-lg"
            >
              클립보드 복사
            </button>
            <button
              onClick={handleSave}
              disabled={!draft.structured}
              className="py-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-2xl font-bold transition-all shadow-lg shadow-emerald-600/20"
            >
              내 저장소에 저장
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LyricArchitectPage;
