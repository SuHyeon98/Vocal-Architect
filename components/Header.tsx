
import React from 'react';
import { ViewType } from '../App';

interface HeaderProps {
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
  savedCount: number;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const Header: React.FC<HeaderProps> = ({ activeView, onViewChange, savedCount, isDarkMode, toggleTheme }) => {
  const getSliderPosition = () => {
    switch (activeView) {
      case 'home': return 'translate-x-0';
      case 'lyric-editor': return 'translate-x-full';
      case 'library': return 'translate-x-[200%]';
      default: return 'translate-x-0';
    }
  };

  const getActiveColor = () => {
    switch (activeView) {
      case 'home': return 'bg-blue-600';
      case 'lyric-editor': return 'bg-indigo-600';
      case 'library': return 'bg-emerald-600';
      default: return 'bg-blue-600';
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-softblack/80 backdrop-blur-md border-b border-slate-200 dark:border-zinc-800">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-6xl">
        <div 
          className="flex items-center gap-2 cursor-pointer group" 
          onClick={() => onViewChange('home')}
        >
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-blue-500/20">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-zinc-400 hidden sm:block transition-all">
            Vocal Architect
          </h1>
        </div>

        <nav className="relative flex items-center bg-slate-100 dark:bg-zinc-900/50 p-1 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-inner">
          {/* Sliding Highlight Background */}
          <div 
            className={`absolute top-1 bottom-1 left-1 w-[calc(33.33%-2.66px)] ${getActiveColor()} rounded-xl transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] shadow-lg ${getSliderPosition()}`}
          />
          
          <button
            onClick={() => onViewChange('home')}
            className={`relative z-10 w-28 sm:w-36 py-2 text-xs sm:text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
              activeView === 'home' ? 'text-white' : 'text-slate-500 dark:text-zinc-500 hover:text-slate-800 dark:hover:text-zinc-200'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            가수 분석
          </button>
          <button
            onClick={() => onViewChange('lyric-editor')}
            className={`relative z-10 w-28 sm:w-36 py-2 text-xs sm:text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
              activeView === 'lyric-editor' ? 'text-white' : 'text-slate-500 dark:text-zinc-500 hover:text-slate-800 dark:hover:text-zinc-200'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            가사 구조화
          </button>
          <button
            onClick={() => onViewChange('library')}
            className={`relative z-10 w-28 sm:w-36 py-2 text-xs sm:text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
              activeView === 'library' ? 'text-white' : 'text-slate-500 dark:text-zinc-500 hover:text-slate-800 dark:hover:text-zinc-200'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
            내 저장소
            {savedCount > 0 && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full transition-all ${
                activeView === 'library' ? 'bg-white/30 text-white' : 'bg-blue-600 text-white'
              }`}>
                {savedCount}
              </span>
            )}
          </button>
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-800 transition-all border border-slate-200 dark:border-zinc-800 active:scale-90 shadow-sm"
            aria-label="Toggle theme"
          >
            {isDarkMode ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
