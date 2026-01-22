
import React from 'react';
import { HistoryItem } from '../types';

interface SearchHistoryProps {
  history: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
  onDelete: (id: string) => void;
}

const SearchHistory: React.FC<SearchHistoryProps> = ({ history, onSelect, onDelete }) => {
  if (history.length === 0) return null;

  return (
    <div className="bg-white dark:bg-softblack-card rounded-3xl border border-slate-200 dark:border-zinc-800 overflow-hidden backdrop-blur-sm shadow-xl dark:shadow-2xl">
      <div className="p-5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
        <h3 className="text-lg font-bold flex items-center gap-2 text-slate-800 dark:text-zinc-100">
          <svg className="w-5 h-5 text-indigo-500 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          최근 분석 기록
        </h3>
        <span className="text-xs font-bold text-slate-400 dark:text-zinc-600 bg-slate-100 dark:bg-zinc-900 px-2 py-0.5 rounded-full">{history.length}/10</span>
      </div>
      
      <div className="divide-y divide-slate-100 dark:divide-zinc-800 max-h-[400px] overflow-y-auto">
        {history.map((item) => (
          <div 
            key={item.id} 
            className="group relative hover:bg-slate-50 dark:hover:bg-zinc-900/50 transition-colors"
          >
            <button
              onClick={() => onSelect(item)}
              className="w-full text-left p-4 pr-12 flex flex-col gap-1"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700 dark:text-zinc-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">{item.name}</span>
                <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-600 ml-2 flex-shrink-0">
                  {new Date(item.timestamp).toLocaleDateString()}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-500 line-clamp-1">{item.styleKo}</p>
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(item.id);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-300 dark:text-zinc-700 hover:text-red-500 transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SearchHistory;
