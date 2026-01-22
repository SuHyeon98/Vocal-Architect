
import React, { useState } from 'react';
import { SavedPrompt, SavedLyric } from '../types';

interface SavedPromptsPageProps {
  prompts: SavedPrompt[];
  lyrics: SavedLyric[];
  onDeletePrompt: (id: string) => void;
  onDeleteLyric: (id: string) => void;
  onBack: () => void;
}

const SavedPromptsPage: React.FC<SavedPromptsPageProps> = ({ prompts, lyrics, onDeletePrompt, onDeleteLyric, onBack }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'prompts' | 'lyrics'>('prompts');

  const filteredPrompts = prompts.filter(p => 
    p.singerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.mood.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.prompt.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredLyrics = lyrics.filter(l => 
    l.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (l.singerName || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('클립보드에 복사되었습니다!');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors text-sm mb-2 font-bold">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            홈으로 돌아가기
          </button>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">내 저장소</h2>
        </div>
        <div className="relative w-full md:w-72">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="검색어를 입력하세요..."
            className="w-full bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/50 rounded-xl py-3 px-4 pl-10 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all shadow-md dark:shadow-none"
          />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
      </div>

      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800">
        <button 
          onClick={() => setActiveTab('prompts')}
          className={`px-6 py-3 font-bold text-sm transition-all border-b-2 ${activeTab === 'prompts' ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' : 'border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
        >
          저장된 프롬프트 ({prompts.length})
        </button>
        <button 
          onClick={() => setActiveTab('lyrics')}
          className={`px-6 py-3 font-bold text-sm transition-all border-b-2 ${activeTab === 'lyrics' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
        >
          저장된 가사 ({lyrics.length})
        </button>
      </div>

      {activeTab === 'prompts' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPrompts.map((item) => (
            <div key={item.id} className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-6 flex flex-col gap-4 shadow-xl dark:shadow-none transition-transform hover:scale-[1.02]">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white">{item.singerName}</h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20 rounded-md mt-1 inline-block uppercase">{item.mood}</span>
                </div>
                <button onClick={() => onDeletePrompt(item.id)} className="p-2 text-slate-300 dark:text-slate-500 hover:text-red-500 rounded-lg transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
              </div>
              <p className="text-xs font-mono text-emerald-700 dark:text-blue-300 bg-slate-50 dark:bg-black/40 p-4 rounded-xl line-clamp-4 h-28 shadow-inner overflow-hidden">{item.prompt}</p>
              <button onClick={() => copyToClipboard(item.prompt)} className="w-full py-3 bg-slate-800 hover:bg-emerald-600 text-white rounded-xl font-bold text-sm transition-colors">프롬프트 복사</button>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLyrics.map((item) => (
            <div key={item.id} className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-6 flex flex-col gap-4 shadow-xl dark:shadow-none transition-transform hover:scale-[1.02]">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white truncate">{item.title}</h4>
                  {item.singerName && <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20 rounded-md mt-1 inline-block">{item.singerName} 스타일</span>}
                </div>
                <button onClick={() => onDeleteLyric(item.id)} className="p-2 text-slate-300 dark:text-slate-500 hover:text-red-500 rounded-lg transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
              </div>
              <p className="text-xs font-mono text-indigo-700 dark:text-indigo-300 bg-slate-50 dark:bg-black/40 p-4 rounded-xl line-clamp-4 h-28 whitespace-pre-wrap shadow-inner overflow-hidden">{item.structuredLyrics}</p>
              <button onClick={() => copyToClipboard(item.structuredLyrics)} className="w-full py-3 bg-slate-800 hover:bg-indigo-600 text-white rounded-xl font-bold text-sm transition-colors">가사 복사</button>
            </div>
          ))}
        </div>
      )}

      {(activeTab === 'prompts' ? filteredPrompts : filteredLyrics).length === 0 && (
        <div className="py-32 text-center flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-300 dark:text-slate-600">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
          </div>
          <p className="text-slate-400 dark:text-slate-500 font-bold">저장된 항목이 없습니다.</p>
        </div>
      )}
    </div>
  );
};

export default SavedPromptsPage;
