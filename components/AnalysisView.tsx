
import React, { useState, useEffect, useRef } from 'react';
import { SingerAnalysis, MoodVariation } from '../types';
import { refinePrompt, generateSongSpecificPrompt } from '../geminiService';
import LoadingSpinner from './LoadingSpinner';

interface AnalysisViewProps {
  analysis: SingerAnalysis;
  prompts: string[];
  onPromptsChange: (prompts: string[]) => void;
  onSavePrompt?: (singerName: string, mood: string, prompt: string) => void;
}

/**
 * A component that applies a subtle fade-and-slide animation when it enters the viewport.
 */
const ScrollAnimate: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    const currentRef = domRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);

  return (
    <div
      ref={domRef}
      className={`transition-all duration-1000 transform ease-out ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      } ${className}`}
    >
      {children}
    </div>
  );
};

const AnalysisView: React.FC<AnalysisViewProps> = ({ analysis, prompts, onPromptsChange, onSavePrompt }) => {
  const [refiningIndices, setRefiningIndices] = useState<Set<number>>(new Set());
  const [songInputIndex, setSongInputIndex] = useState<number | null>(null);
  const [instructionIndex, setInstructionIndex] = useState<number | null>(null);
  const [songQuery, setSongQuery] = useState('');
  const [userInstruction, setUserInstruction] = useState('');

  const copyToClipboard = (text: string, label: string = '프롬프트') => {
    navigator.clipboard.writeText(text);
    alert(`${label}가 클립보드에 복사되었습니다!`);
  };

  const handlePromptChange = (index: number, value: string) => {
    const newPrompts = [...prompts];
    newPrompts[index] = value;
    onPromptsChange(newPrompts);
  };

  const handleRefine = async (index: number) => {
    if (refiningIndices.has(index)) return;

    setRefiningIndices(prev => new Set(prev).add(index));
    try {
      const refined = await refinePrompt(
        analysis.name,
        analysis.vocalTextureEn,
        prompts[index],
        userInstruction
      );
      handlePromptChange(index, refined);
      setInstructionIndex(null);
      setUserInstruction('');
    } catch (err) {
      console.error("Refinement failed", err);
      alert("프롬프트 정교화에 실패했습니다.");
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

  const playOnYoutube = (songName: string) => {
    const query = encodeURIComponent(`${analysis.name} ${songName}`);
    window.open(`https://www.youtube.com/results?search_query=${query}`, '_blank');
  };

  return (
    <div className="space-y-12 pb-12">
      {/* Profile Header */}
      <ScrollAnimate className="p-8 bg-white dark:bg-softblack-card border border-slate-200 dark:border-zinc-800 rounded-3xl shadow-xl dark:shadow-2xl">
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-1 block">보컬 아키텍처 분석</span>
              <h2 className="text-4xl font-extrabold text-slate-900 dark:text-zinc-100 tracking-tight">{analysis.name}</h2>
            </div>
            {/* Limit tags to 6 and center text inside them */}
            <div className="flex flex-wrap gap-2">
              {analysis.moodTags.slice(0, 6).map((tag, idx) => (
                <span key={idx} className="inline-flex items-center justify-center min-w-[64px] px-3 py-1 bg-indigo-50 dark:bg-zinc-900 border border-indigo-100 dark:border-zinc-800 text-indigo-600 dark:text-zinc-400 text-xs font-bold rounded-full text-center">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
          
          {/* Vocal DNA Section */}
          <div className="p-5 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/30 rounded-2xl relative overflow-hidden group">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Vocal DNA Style Tags
              </h4>
              <div className="flex gap-2">
                <button 
                  onClick={handleSaveDna}
                  className="text-[10px] bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-900/40 dark:hover:bg-emerald-900/60 text-white dark:text-emerald-400 px-3 py-1 rounded-md border border-emerald-500 dark:border-emerald-900/50 transition-all font-bold flex items-center gap-1 shadow-sm"
                >
                  저장
                </button>
                <button 
                  onClick={() => copyToClipboard(analysis.vocalDnaPrompt, '보컬 DNA')}
                  className="text-[10px] bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded-md transition-all font-bold shadow-md shadow-blue-600/20 flex items-center gap-1"
                >
                  복사하기
                </button>
              </div>
            </div>
            <p className="text-sm font-mono text-blue-900 dark:text-blue-200 leading-relaxed bg-white dark:bg-zinc-950 p-3 rounded-lg border border-blue-100 dark:border-zinc-800 shadow-inner">
              {analysis.vocalDnaPrompt}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 border-t border-slate-100 dark:border-zinc-800 pt-8">
            {/* Style Section: Bilingual display */}
            <div>
              <h4 className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mb-3 uppercase flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" /></svg>
                음악 스타일
              </h4>
              <div className="p-4 bg-slate-50 dark:bg-zinc-900 rounded-xl border border-slate-100 dark:border-zinc-800">
                <p className="text-slate-800 dark:text-zinc-200 leading-relaxed font-semibold">{analysis.styleKo}</p>
                <p className="text-xs text-slate-500 dark:text-zinc-500 mt-2 font-medium italic leading-relaxed">{analysis.styleEn}</p>
              </div>
            </div>

            {/* Vocal Texture Section: Bilingual display */}
            <div>
              <h4 className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mb-3 uppercase flex items-center gap-2">
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                목소리 특징
              </h4>
              <div className="p-4 bg-slate-50 dark:bg-zinc-900 rounded-xl border border-slate-100 dark:border-zinc-800">
                <p className="text-slate-800 dark:text-zinc-200 leading-relaxed font-semibold">{analysis.vocalTextureKo}</p>
                <p className="text-xs text-slate-500 dark:text-zinc-500 mt-2 font-medium italic leading-relaxed">{analysis.vocalTextureEn}</p>
              </div>
            </div>
          </div>
        </div>
      </ScrollAnimate>

      {/* Suno Mood Variations */}
      <div className="space-y-6">
        <ScrollAnimate>
          <h3 className="text-xl font-bold flex items-center gap-2 px-2 text-slate-800 dark:text-zinc-100">
            <svg className="w-6 h-6 text-blue-600 dark:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
            분위기별 프롬프트 제안
          </h3>
        </ScrollAnimate>
        
        <div className="grid grid-cols-1 gap-6">
          {analysis.moodVariations.map((variation: MoodVariation, idx: number) => (
            <ScrollAnimate key={idx}>
              <div className="p-6 bg-white dark:bg-softblack-card border border-slate-200 dark:border-zinc-800 rounded-2xl group hover:border-blue-500/40 dark:hover:border-blue-500/40 transition-all relative overflow-hidden shadow-sm hover:shadow-lg dark:shadow-2xl">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                    variation.mood.includes('댄스') ? 'bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400' :
                    variation.mood.includes('발라드') ? 'bg-pink-100 text-pink-600 dark:bg-pink-950 dark:text-pink-400' :
                    'bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400'
                  }`}>
                    {variation.mood}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <button 
                      onClick={() => handleSave(idx)}
                      className="text-xs bg-emerald-50 dark:bg-emerald-950 hover:bg-emerald-100 dark:hover:bg-emerald-900 text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-900/50 transition-colors flex items-center gap-2 font-bold"
                    >
                      저장
                    </button>
                    <button 
                      onClick={() => setSongInputIndex(songInputIndex === idx ? null : idx)}
                      className={`text-xs px-3 py-1.5 rounded-lg border transition-all font-bold ${songInputIndex === idx ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300'}`}
                    >
                      곡별 생성
                    </button>
                    <button 
                      onClick={() => setInstructionIndex(instructionIndex === idx ? null : idx)}
                      className={`text-xs px-3 py-1.5 rounded-lg border transition-all font-bold shadow-md ${instructionIndex === idx ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/50'}`}
                    >
                      AI 정교화
                    </button>
                    <button 
                      onClick={() => copyToClipboard(prompts[idx] || '')}
                      className="text-xs bg-slate-800 dark:bg-zinc-700 hover:bg-slate-900 dark:hover:bg-zinc-600 text-white dark:text-zinc-300 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2 font-bold"
                    >
                      복사
                    </button>
                  </div>
                </div>

                {/* Specific Song Tool */}
                {songInputIndex === idx && (
                  <div className="mb-4 flex gap-2 animate-in slide-in-from-top-2">
                    <input
                      type="text"
                      value={songQuery}
                      onChange={(e) => setSongQuery(e.target.value)}
                      placeholder="참고할 곡 제목 입력 (예: 밤편지)..."
                      className="flex-1 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => handleGenerateSongSpecific(idx)}
                      className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-bold"
                    >
                      {refiningIndices.has(idx) ? <LoadingSpinner size="sm" /> : '생성'}
                    </button>
                  </div>
                )}

                {/* Refinement Tool */}
                {instructionIndex === idx && (
                  <div className="mb-4 flex gap-2 animate-in slide-in-from-top-2">
                    <input
                      type="text"
                      value={userInstruction}
                      onChange={(e) => setUserInstruction(e.target.value)}
                      placeholder="요청 사항 입력 (예: 더 웅장하게, 재즈 풍으로)..."
                      className="flex-1 bg-indigo-50 dark:bg-zinc-950 border border-indigo-200 dark:border-zinc-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <button
                      onClick={() => handleRefine(idx)}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-bold"
                    >
                      {refiningIndices.has(idx) ? <LoadingSpinner size="sm" /> : '실행'}
                    </button>
                  </div>
                )}

                <textarea
                  value={prompts[idx] || ''}
                  onChange={(e) => handlePromptChange(idx, e.target.value)}
                  rows={3}
                  className="w-full bg-slate-50 dark:bg-zinc-950 p-4 rounded-xl border border-slate-200 dark:border-zinc-800 font-mono text-indigo-700 dark:text-blue-400 text-sm leading-relaxed focus:outline-none focus:ring-1 focus:ring-blue-500/50 resize-none shadow-inner"
                />
              </div>
            </ScrollAnimate>
          ))}
        </div>
      </div>

      {/* Grounding Sources */}
      {analysis.sources && analysis.sources.length > 0 && (
        <ScrollAnimate className="p-6 bg-white dark:bg-softblack-card border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm dark:shadow-2xl">
          <h3 className="text-sm font-bold text-slate-500 dark:text-zinc-500 uppercase mb-4 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
            심층 분석 소스 및 커뮤니티 데이터
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analysis.sources.map((source, idx) => (
              <a 
                key={idx} 
                href={source.uri} 
                target="_blank" 
                rel="noopener noreferrer"
                className="group p-4 bg-slate-50 dark:bg-zinc-900/40 hover:bg-white dark:hover:bg-zinc-800/60 border border-slate-200 dark:border-zinc-800 rounded-xl transition-all shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white dark:bg-zinc-800 rounded-lg shadow-sm">
                    <img src={`https://www.google.com/s2/favicons?domain=${new URL(source.uri).hostname}`} alt="" className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-bold text-slate-800 dark:text-zinc-200 group-hover:text-blue-600 transition-colors truncate">{source.title}</span>
                </div>
              </a>
            ))}
          </div>
        </ScrollAnimate>
      )}

      {/* Representative Songs */}
      <div>
        <ScrollAnimate>
          <h3 className="text-lg font-bold mb-4 px-2 text-slate-500 dark:text-zinc-500 flex items-center gap-2">
            대표 트랙 (클릭 시 YouTube로 연결)
          </h3>
        </ScrollAnimate>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {analysis.representativeSongs.map((song, idx) => (
            <ScrollAnimate key={idx}>
              <button 
                onClick={() => playOnYoutube(song)}
                className="w-full p-4 bg-white dark:bg-softblack-card border border-slate-200 dark:border-zinc-800 rounded-2xl flex items-center gap-4 shadow-sm hover:border-red-500/50 hover:bg-red-50/10 dark:hover:bg-red-950/10 transition-all text-left group"
              >
                <div className="w-10 h-10 bg-blue-50 dark:bg-zinc-950 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-500 shadow-sm dark:shadow-lg group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 4-8 4z"/>
                  </svg>
                </div>
                <div className="flex-1 truncate">
                  <span className="text-slate-700 dark:text-zinc-300 font-bold block group-hover:text-red-600 transition-colors truncate">{song}</span>
                  <span className="text-[10px] text-slate-400 dark:text-zinc-600 font-medium">Click to Play</span>
                </div>
              </button>
            </ScrollAnimate>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnalysisView;
