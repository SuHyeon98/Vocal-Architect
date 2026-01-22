
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
    <div className="bg-slate-800/40 rounded-3xl border border-slate-700/50 overflow-hidden backdrop-blur-sm">
      <div className="p-5 border-b border-slate-700/50 flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          최근 분석 기록
        </h3>
        <span className="text-xs text-slate-500 bg-slate-700/50 px-2 py-0.5 rounded-full">{history.length}/10</span>
      </div>
      
      <div className="divide-y divide-slate-700/30 max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700">
        {history.map((item) => (
          <div 
            key={item.id} 
            className="group relative hover:bg-slate-700/20 transition-colors"
          >
            <button
              onClick={() => onSelect(item)}
              className="w-full text-left p-4 pr-12 flex flex-col gap-1"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200 group-hover:text-blue-400 transition-colors truncate">{item.name}</span>
                <span className="text-[10px] text-slate-500 ml-2 flex-shrink-0">
                  {new Date(item.timestamp).toLocaleDateString()}
                </span>
              </div>
              <p className="text-xs text-slate-400 line-clamp-1">{item.styleKo}</p>
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(item.id);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
              title="삭제"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SearchHistory;
