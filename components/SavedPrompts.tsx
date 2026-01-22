
import React from 'react';
import { SavedPrompt } from '../types';

interface SavedPromptsProps {
  prompts: SavedPrompt[];
  onDelete: (id: string) => void;
  onViewMore: () => void;
}

const SavedPrompts: React.FC<SavedPromptsProps> = ({ prompts, onDelete, onViewMore }) => {
  if (prompts.length === 0) return null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('프롬프트가 클립보드에 복사되었습니다!');
  };

  return (
    <div className="bg-white dark:bg-softblack-card rounded-3xl border border-slate-200 dark:border-zinc-800 overflow-hidden backdrop-blur-sm shadow-xl dark:shadow-2xl">
      <div className="p-5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
        <h3 className="text-lg font-bold flex items-center gap-2 text-slate-800 dark:text-zinc-100">
          <svg className="w-5 h-5 text-emerald-500 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
          최근 저장
        </h3>
        <button 
          onClick={onViewMore}
          className="text-xs font-bold text-blue-600 dark:text-blue-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
        >
          전체보기
        </button>
      </div>
      
      <div className="divide-y divide-slate-100 dark:divide-zinc-800">
        {prompts.map((item) => (
          <div 
            key={item.id} 
            className="group relative hover:bg-slate-50 dark:hover:bg-zinc-900/50 transition-colors p-4"
          >
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-700 dark:text-zinc-200 text-sm">{item.singerName}</span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 dark:bg-zinc-800 rounded text-slate-500 dark:text-zinc-500 uppercase font-bold tracking-tighter">
                    {item.mood}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => copyToClipboard(item.prompt)}
                    className="p-1.5 text-slate-400 dark:text-zinc-600 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SavedPrompts;
