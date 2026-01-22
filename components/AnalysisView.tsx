
import React, { useState } from 'react';
import { SingerAnalysis, MoodVariation } from '../types';
import { refinePrompt, generateSongSpecificPrompt } from '../geminiService';
import LoadingSpinner from './LoadingSpinner';

interface AnalysisViewProps {
  analysis: SingerAnalysis;
  prompts: string[];
  onPromptsChange: (prompts: string[]) => void;
  onSavePrompt?: (singerName: string, mood: string, prompt: string) => void;
}

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

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Profile Header */}
      <div className="p-8 bg-white dark:bg-softblack-card border border-slate-200 dark:border-zinc-800 rounded-3xl shadow-xl dark:shadow-2xl">
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-1 block">보컬 아키텍처 분석</span>
              <h2 className="text-4xl font-extrabold text-slate-900 dark:text-zinc-100 tracking-tight">{analysis.name}</h2>
            </div>
            <div className="flex gap-2">
              {analysis.moodTags.map((tag, idx) => (
                <span key={idx} className="px-3 py-1 bg-indigo-50 dark:bg-zinc-900 border border-indigo-100 dark:border-zinc-800 text-indigo-600 dark:text-zinc-400 text-xs font-bold rounded-full">
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
            {/* Style Section */}
            <div>
              <h4 className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mb-3 uppercase flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" /></svg>
                음악 스타일
              </h4>
              <div className="p-4 bg-slate-50 dark:bg-zinc-900 rounded-xl border border-slate-100 dark:border-zinc-800">
                <p className="text-slate-800 dark:text-zinc-200 leading-relaxed font-semibold">{analysis.styleKo}</p>
                <p className="text-xs text-slate-500 dark:text-zinc-500 mt-2 font-medium italic">{analysis.styleEn}</p>
              </div>
            </div>

            {/* Vocal Texture Section */}
            <div>
              <h4 className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mb-3 uppercase flex items-center gap-2">
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                목소리 특징
              </h4>
              <div className="p-4 bg-slate-50 dark:bg-zinc-900 rounded-xl border border-slate-100 dark:border-zinc-800">
                <p className="text-slate-800 dark:text-zinc-200 leading-relaxed font-semibold">{analysis.vocalTextureKo}</p>
                <p className="text-xs text-slate-500 dark:text-zinc-500 mt-2 font-medium italic">{analysis.vocalTextureEn}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Suno Mood Variations */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold flex items-center gap-2 px-2 text-slate-800 dark:text-zinc-100">
          <svg className="w-6 h-6 text-blue-600 dark:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
          분위기별 프롬프트 제안
        </h3>
        
        <div className="grid grid-cols-1 gap-4">
          {analysis.moodVariations.map((variation: MoodVariation, idx: number) => (
            <div key={idx} className="p-6 bg-white dark:bg-softblack-card border border-slate-200 dark:border-zinc-800 rounded-2xl group hover:border-blue-500/40 dark:hover:border-blue-500/40 transition-all relative overflow-hidden shadow-sm hover:shadow-md dark:shadow-2xl">
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
          ))}
        </div>
      </div>

      {/* Grounding Sources */}
      {analysis.sources && analysis.sources.length > 0 && (
        <div className="p-6 bg-white dark:bg-softblack-card border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm dark:shadow-2xl">
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
        </div>
      )}

      {/* Representative Songs */}
      <div>
        <h3 className="text-lg font-bold mb-4 px-2 text-slate-500 dark:text-zinc-500 flex items-center gap-2">
          대표 트랙
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {analysis.representativeSongs.map((song, idx) => (
            <div key={idx} className="p-4 bg-white dark:bg-softblack-card border border-slate-200 dark:border-zinc-800 rounded-2xl flex items-center gap-4 shadow-sm hover:border-blue-300 dark:hover:border-zinc-700 transition-all">
              <div className="w-10 h-10 bg-blue-50 dark:bg-zinc-950 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-500 shadow-sm dark:shadow-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" /></svg>
              </div>
              <span className="text-slate-700 dark:text-zinc-300 font-bold truncate">{song}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnalysisView;
