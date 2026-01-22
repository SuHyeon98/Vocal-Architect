
import React from 'react';
import { ViewType } from '../App';

interface HeaderProps {
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
  savedCount: number;
}

const Header: React.FC<HeaderProps> = ({ activeView, onViewChange, savedCount }) => {
  return (
    <header className="sticky top-0 z-50 bg-[#0f172a]/80 backdrop-blur-md border-b border-slate-800/50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-6xl">
        <div 
          className="flex items-center gap-2 cursor-pointer group" 
          onClick={() => onViewChange('home')}
        >
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 hidden sm:block">
            Vocal Architect
          </h1>
        </div>

        <nav className="flex items-center bg-slate-800/50 p-1 rounded-xl border border-slate-700/50 gap-1">
          <button
            onClick={() => onViewChange('home')}
            className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              activeView === 'home' 
                ? 'bg-blue-600 text-white shadow-lg' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            가수 분석
          </button>
          <button
            onClick={() => onViewChange('lyric-editor')}
            className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              activeView === 'lyric-editor' 
                ? 'bg-indigo-600 text-white shadow-lg' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            가사 구조화
          </button>
          <button
            onClick={() => onViewChange('library')}
            className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center gap-2 ${
              activeView === 'library' 
                ? 'bg-emerald-600 text-white shadow-lg' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            내 저장소
            {savedCount > 0 && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                activeView === 'library' ? 'bg-white/20 text-white' : 'bg-blue-600 text-white'
              }`}>
                {savedCount}
              </span>
            )}
          </button>
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <span className="text-xs px-2 py-1 bg-slate-800 rounded text-slate-400 border border-slate-700">Powered by Gemini</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
