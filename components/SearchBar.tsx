
import React, { useState } from 'react';

interface SearchBarProps {
  onSearch: (name: string) => void;
  isLoading: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, isLoading }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !isLoading) {
      onSearch(query);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative group">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="분석할 가수의 이름을 입력하세요 (예: 아이유, 아델, 브루노 마스)..."
        className="w-full bg-white dark:bg-softblack-card border border-slate-200 dark:border-zinc-800 rounded-2xl py-5 px-6 pl-14 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 transition-all duration-300 placeholder:text-slate-400 dark:placeholder:text-zinc-600 shadow-lg shadow-blue-500/5 dark:shadow-2xl text-slate-900 dark:text-zinc-100"
        disabled={isLoading}
      />
      <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-600 group-focus-within:text-blue-500 transition-colors">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <button
        type="submit"
        disabled={isLoading || !query.trim()}
        className="absolute right-3 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-300 dark:disabled:bg-zinc-800 text-white font-bold py-2 px-6 rounded-xl transition-all shadow-lg shadow-blue-600/20"
      >
        {isLoading ? '분석 중...' : '분석하기'}
      </button>
    </form>
  );
};

export default SearchBar;
