
import React, { useState, useEffect } from 'react';
import { SingerAnalysis, MoodVariation } from '../types';
import { refinePrompt, generateSongSpecificPrompt } from '../geminiService';
import LoadingSpinner from './LoadingSpinner';

interface AnalysisViewProps {
  analysis: SingerAnalysis;
  onSavePrompt?: (singerName: string, mood: string, prompt: string) => void;
}

const AnalysisView: React.FC<AnalysisViewProps> = ({ analysis, onSavePrompt }) => {
  const [prompts, setPrompts] = useState<string[]>([]);
  const [refiningIndices, setRefiningIndices] = useState<Set<number>>(new Set());
  const [songInputIndex, setSongInputIndex] = useState<number | null>(null);
  const [songQuery, setSongQuery] = useState('');

  // Initialize prompts from analysis
  useEffect(() => {
    setPrompts(analysis.moodVariations.map(v => v.prompt));
  }, [analysis]);

  const copyToClipboard = (text: string, label: string = '프롬프트') => {
    navigator.clipboard.writeText(text);
    alert(`${label}가 클립보드에 복사되었습니다!`);
  };

  const handlePromptChange = (index: number, value: string) => {
    const newPrompts = [...prompts];
    newPrompts[index] = value;
    setPrompts(newPrompts);
  };

  const handleRefine = async (index: number) => {
    if (refiningIndices.has(index)) return;

    setRefiningIndices(prev => new Set(prev).add(index));
    try {
      const refined = await refinePrompt(
        analysis.name,
        analysis.vocalTextureEn,
        prompts[index]
      );
      handlePromptChange(index, refined);
    } catch (err) {
      console.error("Refinement failed", err);
      alert("프롬프트 최적화에 실패했습니다.");
    } finally {
      setRefiningIndices(prev => {
        const next = new Set(prev);
        next.delete(index);
        return next;
      });
    }
  };

  const handleGenerateSongSpecific = async (index: number) => {
    if (!songQuery.trim() || refiningIndices.has(index)) return;

    setRefiningIndices(prev => new Set(prev).add(index));
    try {
      const tailored = await generateSongSpecificPrompt(
        analysis.name,
        analysis.vocalTextureEn,
        prompts[index],
        songQuery
      );
      handlePromptChange(index, tailored);
      setSongInputIndex(null);
      setSongQuery('');
    } catch (err) {
      console.error("Tailored generation failed", err);
      alert("곡별 프롬프트 생성에 실패했습니다.");
    } finally {
      setRefiningIndices(prev => {
        const next = new Set(prev);
        next.delete(index);
        return next;
      });
    }
  };

  const handleSave = (index: number) => {
    if (onSavePrompt) {
      onSavePrompt(analysis.name, analysis.moodVariations[index].mood, prompts[index]);
      alert('저장되었습니다!');
    }
  };

  const handleSaveDna = () => {
    if (onSavePrompt) {
      onSavePrompt(analysis.name, 'Vocal DNA', analysis.vocalDnaPrompt);
      alert('Vocal DNA 프롬프트가 저장되었습니다!');
    }
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
          
          {/* Copyright-Safe Vocal DNA Section */}
          <div className="p-5 bg-blue-600/10 border border-blue-500/30 rounded-2xl relative overflow-hidden group">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Vocal DNA Style Tags (Copyright Safe)
              </h4>
              <div className="flex gap-2">
                <button 
                  onClick={handleSaveDna}
                  className="text-[10px] bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 px-3 py-1 rounded-md border border-emerald-500/30 transition-all font-bold flex items-center gap-1"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                  저장
                </button>
                <button 
                  onClick={() => copyToClipboard(analysis.vocalDnaPrompt, '보컬 DNA')}
                  className="text-[10px] bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded-md transition-all font-bold"
                >
                  복사하기
                </button>
              </div>
            </div>
            <p className="text-sm font-mono text-blue-100/80 leading-relaxed bg-black/30 p-3 rounded-lg border border-blue-500/10">
              {analysis.vocalDnaPrompt}
            </p>
            <p className="mt-2 text-[10px] text-blue-400/60 italic">
              * 가수의 실명을 사용하지 않고 보컬의 특성만 추출한 안전한 프롬프트입니다. Suno AI의 'Style'란에 그대로 사용하세요.
            </p>
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
          분위기별 프롬프트 제안 (Mood Variations)
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
                <div className="flex gap-2">
                   <button 
                    onClick={() => handleSave(idx)}
                    className="text-xs bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 px-3 py-1.5 rounded-lg border border-emerald-500/30 transition-colors flex items-center gap-2"
                    title="저장하기"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                    저장
                  </button>
                  <button 
                    onClick={() => setSongInputIndex(songInputIndex === idx ? null : idx)}
                    disabled={refiningIndices.has(idx)}
                    className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-600 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" />
                    </svg>
                    곡별 생성
                  </button>
                  <button 
                    onClick={() => handleRefine(idx)}
                    disabled={refiningIndices.has(idx)}
                    className="text-xs bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white px-3 py-1.5 rounded-lg border border-indigo-500/30 transition-colors flex items-center gap-2"
                    title="AI로 프롬프트 최적화"
                  >
                    {refiningIndices.has(idx) && songInputIndex === null ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    )}
                    AI 최적화
                  </button>
                  <button 
                    onClick={() => copyToClipboard(prompts[idx] || '')}
                    className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-600 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                    복사
                  </button>
                </div>
              </div>

              {songInputIndex === idx && (
                <div className="mb-4 flex gap-2 animate-in slide-in-from-top-2 duration-300">
                  <input
                    type="text"
                    value={songQuery}
                    onChange={(e) => setSongQuery(e.target.value)}
                    placeholder="참고할 곡 제목을 입력하세요 (예: 밤양갱, Hype Boy)..."
                    className="flex-1 bg-slate-900/80 border border-blue-500/30 rounded-xl px-4 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all"
                  />
                  <button
                    onClick={() => handleGenerateSongSpecific(idx)}
                    disabled={!songQuery.trim() || refiningIndices.has(idx)}
                    className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2"
                  >
                    {refiningIndices.has(idx) ? <LoadingSpinner size="sm" /> : '생성'}
                  </button>
                </div>
              )}

              <textarea
                value={prompts[idx] || ''}
                onChange={(e) => handlePromptChange(idx, e.target.value)}
                rows={3}
                placeholder="프롬프트를 직접 수정해보세요..."
                className="w-full bg-black/40 p-4 rounded-xl border border-slate-700/50 font-mono text-blue-300 text-sm leading-relaxed focus:outline-none focus:ring-1 focus:ring-blue-500/50 resize-none transition-all"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Grounding Sources */}
      {analysis.sources && analysis.sources.length > 0 && (
        <div className="p-6 bg-slate-800/30 border border-slate-700/50 rounded-2xl">
          <h3 className="text-sm font-bold text-slate-400 uppercase mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            참고 리소스 (Search Sources)
          </h3>
          <div className="flex flex-wrap gap-2">
            {analysis.sources.map((source, idx) => (
              <a 
                key={idx} 
                href={source.uri} 
                target="_blank" 
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-slate-700/50 hover:bg-blue-600/30 border border-slate-600 rounded-lg text-xs text-slate-300 transition-all flex items-center gap-2"
              >
                <img src={`https://www.google.com/s2/favicons?domain=${new URL(source.uri).hostname}`} alt="" className="w-3 h-3" />
                <span className="max-w-[150px] truncate">{source.title}</span>
              </a>
            ))}
          </div>
        </div>
      )}

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
