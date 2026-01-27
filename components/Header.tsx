
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
      case 'score-architect': return 'translate-x-[200%]';
      case 'library': return 'translate-x-[300%]';
      default: return 'translate-x-0';
    }
  };

  const getActiveColor = () => {
    switch (activeView) {
      case 'home': return 'bg-blue-600';
      case 'lyric-editor': return 'bg-indigo-600';
      case 'score-architect': return 'bg-rose-600';
      case 'library': return 'bg-emerald-600';
      default: return 'bg-blue-600';
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-softblack/80 backdrop-blur-md border-b border-slate-200 dark:border-zinc-800">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-6xl">
        <div 
          className="flex items-center gap-3 cursor-pointer group" 
          onClick={() => onViewChange('home')}
        >
          <div className="w-10 h-10 bg-blue-50 dark:bg-zinc-950 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm dark:shadow-xl border border-blue-100 dark:border-white/5">
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-zinc-400 hidden lg:block transition-all tracking-tight">
            Vocal Architect
          </h1>
        </div>

        <nav className="relative flex items-center bg-slate-100 dark:bg-zinc-900/50 p-1 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-inner">
          <div 
            className={`absolute top-1 bottom-1 left-1 w-[calc(25%-2px)] ${getActiveColor()} rounded-xl transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] shadow-lg ${getSliderPosition()}`}
          />
          
          <button
            onClick={() => onViewChange('home')}
            className={`relative z-10 w-20 sm:w-28 py-2 text-xs sm:text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
              activeView === 'home' ? 'text-white' : 'text-slate-500 dark:text-zinc-500 hover:text-slate-800 dark:hover:text-zinc-200'
            }`}
          >
            분석
          </button>
          <button
            onClick={() => onViewChange('lyric-editor')}
            className={`relative z-10 w-20 sm:w-28 py-2 text-xs sm:text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
              activeView === 'lyric-editor' ? 'text-white' : 'text-slate-500 dark:text-zinc-500 hover:text-slate-800 dark:hover:text-zinc-200'
            }`}
          >
            가사
          </button>
          <button
            onClick={() => onViewChange('score-architect')}
            className={`relative z-10 w-20 sm:w-28 py-2 text-xs sm:text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
              activeView === 'score-architect' ? 'text-white' : 'text-slate-500 dark:text-zinc-500 hover:text-slate-800 dark:hover:text-zinc-200'
            }`}
          >
            악보
          </button>
          <button
            onClick={() => onViewChange('library')}
            className={`relative z-10 w-20 sm:w-28 py-2 text-xs sm:text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
              activeView === 'library' ? 'text-white' : 'text-slate-500 dark:text-zinc-500 hover:text-slate-800 dark:hover:text-zinc-200'
            }`}
          >
            저장소
            {savedCount > 0 && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full transition-all ${
                activeView === 'library' ? 'bg-white/30 text-white' : 'bg-blue-600 text-white'
              }`}>
                {savedCount}
              </span>
            )}
          </button>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-800 transition-all border border-slate-200 dark:border-zinc-800 active:scale-90 shadow-sm"
          >
            {isDarkMode ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
