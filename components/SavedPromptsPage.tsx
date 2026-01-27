
import React, { useState } from 'react';
import { SavedPrompt, SavedLyric, Folder } from '../types';

interface SavedPromptsPageProps {
  prompts: SavedPrompt[];
  lyrics: SavedLyric[];
  folders: Folder[];
  onDeletePrompt: (id: string) => void;
  onDeleteLyric: (id: string) => void;
  onUpdatePrompt: (id: string, newText: string, folderId?: string) => void;
  onCreateFolder: (name: string, color: string) => string;
  onDeleteFolder: (id: string) => void;
  onBack: () => void;
}

const SavedPromptsPage: React.FC<SavedPromptsPageProps> = ({ prompts, lyrics, folders, onDeletePrompt, onDeleteLyric, onUpdatePrompt, onCreateFolder, onDeleteFolder, onBack }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'prompts' | 'lyrics'>('prompts');
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBuffer, setEditBuffer] = useState('');
  const [showFolderCreate, setShowFolderCreate] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const filteredPrompts = prompts.filter(p => {
    const matchesSearch = p.singerName.toLowerCase().includes(searchTerm.toLowerCase()) || p.prompt.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFolder = activeFolderId === null || p.folderId === activeFolderId;
    return matchesSearch && matchesFolder;
  });

  const filteredLyrics = lyrics.filter(l => {
    const matchesSearch = l.title.toLowerCase().includes(searchTerm.toLowerCase()) || (l.singerName || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFolder = activeFolderId === null || l.folderId === activeFolderId;
    return matchesSearch && matchesFolder;
  });

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      onCreateFolder(newFolderName, '#6366f1');
      setNewFolderName('');
      setShowFolderCreate(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors text-sm mb-2 font-bold uppercase tracking-tight">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Back to Home
          </button>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">내 저장소 (Library)</h2>
        </div>
        <div className="relative w-full md:w-72">
          <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search content..." className="w-full bg-white dark:bg-softblack-card border border-slate-200 dark:border-zinc-800 rounded-xl py-3 px-4 pl-10 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 shadow-sm" />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeWidth={2} strokeLinecap="round" /></svg>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">보관 폴더 (Folders)</h3>
          <button 
            onClick={() => setShowFolderCreate(!showFolderCreate)} 
            className={`text-xs font-bold transition-colors ${showFolderCreate ? 'text-red-500' : 'text-blue-600'}`}
          >
            {showFolderCreate ? '취소' : '+ 새 폴더'}
          </button>
        </div>
        
        {showFolderCreate && (
          <div className="flex gap-2 p-4 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl animate-in slide-in-from-top-2 shadow-inner">
            <input 
              type="text" 
              value={newFolderName} 
              onChange={e => setNewFolderName(e.target.value)} 
              placeholder="Folder name..." 
              className="flex-1 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-3 py-1.5 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" 
            />
            <button onClick={handleCreateFolder} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-lg text-sm font-bold shadow-md transition-all">생성</button>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => setActiveFolderId(null)} 
            className={`px-4 py-2 rounded-full text-xs font-bold border transition-all ${activeFolderId === null ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/20' : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-500 hover:bg-slate-50'}`}
          >
            전체 보기
          </button>
          {folders.map(f => (
            <div key={f.id} className="group relative flex items-center">
              <button 
                onClick={() => setActiveFolderId(f.id)} 
                className={`pl-4 pr-10 py-2 rounded-full text-xs font-bold border transition-all flex items-center gap-2 ${activeFolderId === f.id ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/20' : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-500 hover:bg-slate-50'}`}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: f.color }}></span> {f.name}
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); onDeleteFolder(f.id); }} 
                className="absolute right-2 p-1.5 text-slate-300 hover:text-red-500 dark:text-zinc-700 dark:hover:text-red-400 transition-colors"
                title="폴더 삭제"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800">
        <button onClick={() => setActiveTab('prompts')} className={`px-6 py-3 font-bold text-sm border-b-2 transition-all ${activeTab === 'prompts' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>프롬프트 ({filteredPrompts.length})</button>
        <button onClick={() => setActiveTab('lyrics')} className={`px-6 py-3 font-bold text-sm border-b-2 transition-all ${activeTab === 'lyrics' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>가사 ({filteredLyrics.length})</button>
      </div>

      {activeTab === 'prompts' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPrompts.length === 0 ? (
            <div className="col-span-full py-20 text-center text-slate-400 font-medium">저장된 프롬프트가 없습니다.</div>
          ) : (
            filteredPrompts.map(item => (
              <div key={item.id} className="bg-white dark:bg-softblack-card border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-col gap-4 group hover:border-emerald-500/30 transition-all">
                <div className="flex justify-between items-start">
                  <div className="flex flex-col gap-1">
                    <h4 className="font-bold text-slate-800 dark:text-zinc-100">{item.singerName}</h4>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">{item.mood}</span>
                  </div>
                  <button onClick={() => onDeletePrompt(item.id)} className="text-slate-300 hover:text-red-500 transition-colors p-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
                <div className="bg-slate-50 dark:bg-zinc-950 p-4 rounded-xl border border-slate-100 dark:border-zinc-800 shadow-inner h-28 overflow-hidden">
                  <p className="text-xs font-mono text-slate-600 dark:text-zinc-400 line-clamp-4 leading-relaxed">{item.prompt}</p>
                </div>
                <button onClick={() => { navigator.clipboard.writeText(item.prompt); alert('복사되었습니다!'); }} className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-slate-800/20 transition-all active:scale-95">프롬프트 복사</button>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLyrics.length === 0 ? (
            <div className="col-span-full py-20 text-center text-slate-400 font-medium">저장된 가사가 없습니다.</div>
          ) : (
            filteredLyrics.map(item => (
              <div key={item.id} className="bg-white dark:bg-softblack-card border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-col gap-4 group hover:border-indigo-500/30 transition-all">
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-slate-800 dark:text-zinc-100 truncate pr-4">{item.title}</h4>
                  <button onClick={() => onDeleteLyric(item.id)} className="text-slate-300 hover:text-red-500 transition-colors p-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
                <div className="bg-slate-50 dark:bg-zinc-950 p-4 rounded-xl border border-slate-100 dark:border-zinc-800 shadow-inner h-28 overflow-hidden">
                  <p className="text-xs font-mono text-slate-600 dark:text-zinc-400 line-clamp-4 leading-relaxed whitespace-pre-wrap">{item.structuredLyrics}</p>
                </div>
                <button onClick={() => { navigator.clipboard.writeText(item.structuredLyrics); alert('복사되었습니다!'); }} className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/20 transition-all active:scale-95">가사 복사</button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default SavedPromptsPage;
