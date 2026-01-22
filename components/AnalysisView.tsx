
import React from 'react';
import { SingerAnalysis, MoodVariation } from '../types';

interface AnalysisViewProps {
  analysis: SingerAnalysis;
}

const AnalysisView: React.FC<AnalysisViewProps> = ({ analysis }) => {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('프롬프트가 클립보드에 복사되었습니다!');
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Profile Header */}
      <div className="p-8 bg-gradient-to-br from-indigo-900/40 to-slate-800/40 border border-indigo-500/20 rounded-3xl backdrop-blur-sm">
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1 block">보컬 아키텍처 분석</span>
              <h2 className="text-4xl font-extrabold text-white tracking-tight">{analysis.name}</h2>
            </div>
            <div className="flex gap-2">
              {analysis.moodTags.map((tag, idx) => (
                <span key={idx} className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium rounded-full">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-8 border-t border-slate-700/50 pt-8">
            {/* Style Section */}
            <div>
              <h4 className="text-sm font-semibold text-indigo-400 mb-3 uppercase flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" /></svg>
                음악 스타일 (Musical Style)
              </h4>
              <div className="space-y-4">
                <div className="p-4 bg-slate-900/30 rounded-xl border border-slate-700/30">
                  <p className="text-slate-100 leading-relaxed font-medium">{analysis.styleKo}</p>
                </div>
                <div className="p-4 bg-slate-800/20 rounded-xl border border-slate-700/20">
                  <p className="text-slate-400 leading-relaxed text-sm italic">{analysis.styleEn}</p>
                </div>
              </div>
            </div>

            {/* Vocal Texture Section */}
            <div>
              <h4 className="text-sm font-semibold text-indigo-400 mb-3 uppercase flex items-center gap-2">
                 <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" /></svg>
                목소리 특징 (Vocal Texture & Technique)
              </h4>
              <div className="space-y-4">
                <div className="p-4 bg-slate-900/30 rounded-xl border border-slate-700/30">
                  <p className="text-slate-100 leading-relaxed font-medium">{analysis.vocalTextureKo}</p>
                </div>
                <div className="p-4 bg-slate-800/20 rounded-xl border border-slate-700/20">
                  <p className="text-slate-400 leading-relaxed text-sm italic">{analysis.vocalTextureEn}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Suno Mood Variations */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold flex items-center gap-2 px-2">
          <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
          Suno AI 커스텀 모드 프롬프트
        </h3>
        
        <div className="grid grid-cols-1 gap-4">
          {analysis.moodVariations.map((variation: MoodVariation, idx: number) => (
            <div key={idx} className="p-6 bg-slate-800/60 border border-slate-700/50 rounded-2xl group hover:border-blue-500/40 transition-all relative overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  variation.mood.includes('댄스') ? 'bg-orange-500/20 text-orange-400' :
                  variation.mood.includes('발라드') ? 'bg-pink-500/20 text-pink-400' :
                  'bg-purple-500/20 text-purple-400'
                }`}>
                  {variation.mood}
                </span>
                <button 
                  onClick={() => copyToClipboard(variation.prompt)}
                  className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-600 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                  복사하기
                </button>
              </div>
              <div className="bg-black/40 p-4 rounded-xl border border-slate-700/50 font-mono text-blue-300 text-sm leading-relaxed break-words">
                {variation.prompt}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Representative Songs */}
      <div>
        <h3 className="text-lg font-bold mb-4 px-2 text-slate-400">주요 트랙 (Tracks)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {analysis.representativeSongs.map((song, idx) => (
            <div key={idx} className="p-4 bg-slate-800/30 border border-slate-700/50 rounded-2xl flex items-center gap-4 hover:border-blue-500/30 transition-all cursor-default group">
              <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center text-slate-400 group-hover:text-blue-400 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" />
                </svg>
              </div>
              <span className="text-slate-300 font-medium truncate">{song}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnalysisView;
