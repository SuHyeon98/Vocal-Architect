
import React, { useState } from 'react';
import { structureLyrics } from '../geminiService';
import { HistoryItem, Folder } from '../types';
import { LyricDraft } from '../App';
import LoadingSpinner from './LoadingSpinner';

interface LyricArchitectPageProps {
  onBack: () => void;
  onSaveLyric: (title: string, singerName: string | null, raw: string, structured: string, folderId?: string) => void;
  artistHistory: HistoryItem[];
  folders: Folder[];
  draft: LyricDraft;
  onDraftChange: (draft: LyricDraft) => void;
}

const LyricArchitectPage: React.FC<LyricArchitectPageProps> = ({ onBack, onSaveLyric, artistHistory, folders, draft, onDraftChange }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showFolderSelect, setShowFolderSelect] = useState(false);

  const updateDraft = (updates: Partial<LyricDraft>) => {
    onDraftChange({ ...draft, ...updates });
  };

  const handleStructure = async () => {
    if (!draft.raw.trim() || isLoading) return;
    setIsLoading(true);
    try {
      const selectedArtist = artistHistory.find(a => a.id === draft.artistId);
      const result = await structureLyrics(draft.raw, selectedArtist ? { name: selectedArtist.name, style: selectedArtist.styleKo, texture: selectedArtist.vocalTextureKo } : undefined);
      updateDraft({ structured: result });
    } catch (err) {
      alert("가사 구조화 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecuteSave = (folderId?: string) => {
    if (!draft.structured.trim()) return;
    const selectedArtist = artistHistory.find(a => a.id === draft.artistId);
    onSaveLyric(draft.title.trim() || '무제 가사', selectedArtist?.name || null, draft.raw, draft.structured, folderId);
    setShowFolderSelect(false);
    alert('저장되었습니다!');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <button onClick={onBack} className="text-sm font-bold text-slate-500 uppercase flex items-center gap-2">Back to Home</button>
        <div className="flex items-center justify-between"><h2 className="text-3xl font-extrabold">Lyric Architect</h2></div>
      </div>

      <div className="p-6 bg-white dark:bg-slate-800/40 rounded-3xl border border-slate-200 dark:border-slate-700/50 space-y-6 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div><label className="block text-xs font-bold text-slate-400 uppercase mb-2">가사 제목</label><input type="text" value={draft.title} onChange={e => updateDraft({ title: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-900/60 border rounded-xl px-4 py-3 text-sm" /></div>
          <div><label className="block text-xs font-bold text-slate-400 uppercase mb-2">아티스트 스타일</label><select value={draft.artistId} onChange={e => updateDraft({ artistId: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-900/60 border rounded-xl px-4 py-3 text-sm">{<option value="">적용 안 함</option>}{artistHistory.map(a => <option key={a.id} value={a.id}>{a.name} 스타일</option>)}</select></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <textarea value={draft.raw} onChange={e => updateDraft({ raw: e.target.value })} placeholder="여기에 가사를 입력하세요..." className="w-full h-[400px] bg-white dark:bg-slate-800/30 border rounded-3xl p-6" />
          <button onClick={handleStructure} disabled={!draft.raw.trim() || isLoading} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold">{isLoading ? '처리 중...' : 'Suno AI 구조화'}</button>
        </div>
        <div className="space-y-4">
          <div className="w-full h-[400px] bg-slate-50 dark:bg-black/40 border rounded-3xl p-6 font-mono text-sm overflow-y-auto whitespace-pre-wrap">{draft.structured || "구조화 결과가 여기에 표시됩니다."}</div>
          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => { navigator.clipboard.writeText(draft.structured); alert('복사되었습니다!'); }} className="py-4 bg-slate-800 text-white rounded-2xl font-bold">복사</button>
            <div className="relative">
              <button onClick={() => setShowFolderSelect(!showFolderSelect)} disabled={!draft.structured} className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold">저장소 담기</button>
              {showFolderSelect && (
                <div className="absolute bottom-full mb-2 left-0 w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-2xl p-3 z-10 animate-in slide-in-from-bottom-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">폴더 선택</p>
                  <div className="flex flex-col gap-1 max-h-40 overflow-y-auto">
                    <button onClick={() => handleExecuteSave()} className="text-left text-xs p-2 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-lg">미분류</button>
                    {folders.map(f => (
                      <button key={f.id} onClick={() => handleExecuteSave(f.id)} className="text-left text-xs p-2 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-lg flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: f.color }}></span> {f.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LyricArchitectPage;
