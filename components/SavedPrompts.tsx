
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
    <div className="bg-slate-800/40 rounded-3xl border border-slate-700/50 overflow-hidden backdrop-blur-sm">
      <div className="p-5 border-b border-slate-700/50 flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
          최근 저장
        </h3>
        <button 
          onClick={onViewMore}
          className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
        >
          전체보기
        </button>
      </div>
      
      <div className="divide-y divide-slate-700/30">
        {prompts.map((item) => (
          <div 
            key={item.id} 
            className="group relative hover:bg-slate-700/20 transition-colors p-4"
          >
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-200 text-sm">{item.singerName}</span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-slate-700 rounded text-slate-400 uppercase tracking-tighter">
                    {item.mood}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => copyToClipboard(item.prompt)}
                    className="p-1.5 text-slate-500 hover:text-blue-400 transition-colors"
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
