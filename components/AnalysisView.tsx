
import React, { useState, useEffect, useRef } from 'react';
import { SingerAnalysis, MoodVariation, Folder } from '../types';
import { refinePrompt, generateSongSpecificPrompt } from '../geminiService';
import LoadingSpinner from './LoadingSpinner';

interface AnalysisViewProps {
  analysis: SingerAnalysis;
  prompts: string[];
  onPromptsChange: (prompts: string[]) => void;
  onSavePrompt: (singerName: string, mood: string, prompt: string, folderId?: string) => void;
  folders: Folder[];
  onCreateFolder: (name: string, color: string) => string;
}

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
    if (currentRef) observer.observe(currentRef);
    return () => { if (currentRef) observer.unobserve(currentRef); };
  }, []);

  return (
    <div ref={domRef} className={`transition-all duration-1000 transform ease-out ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} ${className}`}>{children}</div>
  );
};

const AnalysisView: React.FC<AnalysisViewProps> = ({ analysis, prompts, onPromptsChange, onSavePrompt, folders, onCreateFolder }) => {
  // DNA Local State
  const [localDnaPrompt, setLocalDnaPrompt] = useState(analysis.vocalDnaPrompt);
  const [isDnaProcessing, setIsDnaProcessing] = useState(false);
  const [showDnaRefineInput, setShowDnaRefineInput] = useState(false);
  const [showDnaSongInput, setShowDnaSongInput] = useState(false);
  const [dnaInstruction, setDnaInstruction] = useState('');
  const [dnaSongQuery, setDnaSongQuery] = useState('');

  const [refiningIndices, setRefiningIndices] = useState<Set<number>>(new Set());
  const [songInputIndex, setSongInputIndex] = useState<number | null>(null);
  const [instructionIndex, setInstructionIndex] = useState<number | null>(null);
  const [saveFolderIndex, setSaveFolderIndex] = useState<number | null>(null);
  const [showDnaFolderSelect, setShowDnaFolderSelect] = useState(false);
  const [songQuery, setSongQuery] = useState('');
  const [userInstruction, setUserInstruction] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [newDnaFolderName, setNewDnaFolderName] = useState('');

  const copyToClipboard = (text: string, label: string = '프롬프트') => {
    navigator.clipboard.writeText(text);
    alert(`${label}가 클립보드에 복사되었습니다!`);
  };

  // Vocal DNA Refinement
  const handleRefineDna = async () => {
    if (isDnaProcessing) return;
    setIsDnaProcessing(true);
    try {
      const refined = await refinePrompt(analysis.name, analysis.vocalTextureEn, localDnaPrompt, dnaInstruction);
      setLocalDnaPrompt(refined);
      setShowDnaRefineInput(false);
      setDnaInstruction('');
    } catch (err) {
      alert("DNA 정교화에 실패했습니다.");
    } finally {
      setIsDnaProcessing(false);
    }
  };

  // Vocal DNA Song Specific Generation
  const handleGenerateSongSpecificDna = async () => {
    if (!dnaSongQuery.trim() || isDnaProcessing) return;
    setIsDnaProcessing(true);
    try {
      const tailored = await generateSongSpecificPrompt(analysis.name, analysis.vocalTextureEn, localDnaPrompt, dnaSongQuery);
      setLocalDnaPrompt(tailored);
      setShowDnaSongInput(false);
      setDnaSongQuery('');
    } catch (err) {
      alert("곡별 DNA 생성에 실패했습니다.");
    } finally {
      setIsDnaProcessing(false);
    }
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
      const refined = await refinePrompt(analysis.name, analysis.vocalTextureEn, prompts[index], userInstruction);
      handlePromptChange(index, refined);
      setInstructionIndex(null);
      setUserInstruction('');
    } catch (err) {
      alert("프롬프트 정교화에 실패했습니다.");
    } finally {
      setRefiningIndices(prev => { const n = new Set(prev); n.delete(index); return n; });
    }
  };

  const handleGenerateSongSpecific = async (index: number) => {
    if (!songQuery.trim() || refiningIndices.has(index)) return;
    setRefiningIndices(prev => new Set(prev).add(index));
    try {
      const tailored = await generateSongSpecificPrompt(analysis.name, analysis.vocalTextureEn, prompts[index], songQuery);
      handlePromptChange(index, tailored);
      setSongInputIndex(null);
      setSongQuery('');
    } catch (err) {
      alert("곡별 프롬프트 생성에 실패했습니다.");
    } finally {
      setRefiningIndices(prev => { const n = new Set(prev); n.delete(index); return n; });
    }
  };

  const executeSave = (index: number, folderId?: string) => {
    onSavePrompt(analysis.name, analysis.moodVariations[index].mood, prompts[index], folderId);
    setSaveFolderIndex(null);
    alert('저장되었습니다!');
  };

  const executeDnaSave = (folderId?: string) => {
    onSavePrompt(analysis.name, "Vocal DNA", localDnaPrompt, folderId);
    setShowDnaFolderSelect(false);
    alert('Vocal DNA가 저장되었습니다!');
  };

  const handleCreateAndSave = (index: number) => {
    if (!newFolderName.trim()) return;
    const folderId = onCreateFolder(newFolderName, '#6366f1');
    executeSave(index, folderId);
    setNewFolderName('');
  };

  const handleCreateAndSaveDna = () => {
    if (!newDnaFolderName.trim()) return;
    const folderId = onCreateFolder(newDnaFolderName, '#3b82f6');
    executeDnaSave(folderId);
    setNewDnaFolderName('');
  };

  return (
    <div className="space-y-12 pb-12">
      <ScrollAnimate className="p-8 bg-white dark:bg-softblack-card border border-slate-200 dark:border-zinc-800 rounded-3xl shadow-xl">
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-1 block">보컬 아키텍처 분석</span>
              <h2 className="text-4xl font-extrabold text-slate-900 dark:text-zinc-100 tracking-tight">{analysis.name}</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {analysis.moodTags.slice(0, 6).map((tag, idx) => (
                <span key={idx} className="inline-flex items-center justify-center min-w-[64px] px-3 py-1 bg-indigo-50 dark:bg-zinc-900 border border-indigo-100 dark:border-zinc-800 text-indigo-600 dark:text-zinc-400 text-xs font-bold rounded-full">#{tag}</span>
              ))}
            </div>
          </div>
          
          {/* Vocal DNA Context Section */}
          <div className="p-5 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/30 rounded-2xl relative">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-2">Vocal DNA Context</h4>
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={() => setShowDnaFolderSelect(!showDnaFolderSelect)} 
                  className="text-[10px] bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg font-bold transition-colors shadow-sm"
                >
                  저장소 담기
                </button>
                <button 
                  onClick={() => copyToClipboard(localDnaPrompt, '보컬 DNA')} 
                  className="text-[10px] bg-slate-800 text-white px-3 py-1.5 rounded-lg font-bold shadow-sm"
                >
                  복사하기
                </button>
                <button 
                  onClick={() => { setShowDnaRefineInput(!showDnaRefineInput); setShowDnaSongInput(false); }} 
                  className={`text-[10px] px-3 py-1.5 rounded-lg font-bold shadow-sm transition-colors ${showDnaRefineInput ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-zinc-800 text-indigo-600 border border-indigo-200'}`}
                >
                  AI 수정
                </button>
                <button 
                  onClick={() => { setShowDnaSongInput(!showDnaSongInput); setShowDnaRefineInput(false); }} 
                  className={`text-[10px] px-3 py-1.5 rounded-lg font-bold shadow-sm transition-colors ${showDnaSongInput ? 'bg-blue-600 text-white' : 'bg-white dark:bg-zinc-800 text-blue-600 border border-blue-200'}`}
                >
                  곡별 DNA 생성
                </button>
              </div>
            </div>

            {showDnaFolderSelect && (
              <div className="mb-4 p-4 bg-white dark:bg-zinc-900 border border-emerald-100 dark:border-emerald-900/30 rounded-xl animate-in fade-in slide-in-from-top-2 shadow-lg z-10">
                <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-2 uppercase">DNA 저장 폴더 선택</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  <button onClick={() => executeDnaSave()} className="px-3 py-1.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-xs font-bold hover:bg-emerald-50">미분류</button>
                  {folders.map(f => (
                    <button key={f.id} onClick={() => executeDnaSave(f.id)} className="px-3 py-1.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-xs font-bold hover:bg-emerald-50 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: f.color }}></span> {f.name}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input type="text" value={newDnaFolderName} onChange={e => setNewDnaFolderName(e.target.value)} placeholder="새 폴더 이름..." className="flex-1 text-xs px-3 py-1.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 rounded-lg focus:outline-none" />
                  <button onClick={handleCreateAndSaveDna} className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold">새 폴더 생성 및 저장</button>
                </div>
              </div>
            )}

            {showDnaRefineInput && (
              <div className="mb-4 flex gap-2 animate-in slide-in-from-top-2">
                <input type="text" value={dnaInstruction} onChange={e => setDnaInstruction(e.target.value)} placeholder="수정 요청 (예: 더 허스키하고 숨소리 섞인 스타일로)..." className="flex-1 bg-white dark:bg-zinc-950 border border-indigo-100 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                <button onClick={handleRefineDna} disabled={isDnaProcessing} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md min-w-[80px]">
                  {isDnaProcessing ? '...' : '적용'}
                </button>
              </div>
            )}

            {showDnaSongInput && (
              <div className="mb-4 flex gap-2 animate-in slide-in-from-top-2">
                <input type="text" value={dnaSongQuery} onChange={e => setDnaSongQuery(e.target.value)} placeholder="참고할 곡 제목 입력 (예: 밤편지)..." className="flex-1 bg-white dark:bg-zinc-950 border border-blue-100 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                <button onClick={handleGenerateSongSpecificDna} disabled={isDnaProcessing} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md min-w-[80px]">
                  {isDnaProcessing ? '...' : '생성'}
                </button>
              </div>
            )}

            <div className="relative group">
               <textarea 
                  value={localDnaPrompt} 
                  onChange={(e) => setLocalDnaPrompt(e.target.value)}
                  rows={2}
                  className="w-full text-sm font-mono text-blue-900 dark:text-blue-200 leading-relaxed bg-white dark:bg-zinc-950 p-3 rounded-lg border border-blue-100 dark:border-zinc-800 shadow-inner resize-none focus:outline-none focus:ring-1 focus:ring-blue-400"
               />
               {isDnaProcessing && (
                 <div className="absolute inset-0 bg-white/50 dark:bg-zinc-950/50 flex items-center justify-center rounded-lg backdrop-blur-[1px]">
                   <LoadingSpinner size="sm" />
                 </div>
               )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 border-t border-slate-100 dark:border-zinc-800 pt-8">
            <div>
              <h4 className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mb-3 uppercase flex items-center gap-2">음악 스타일</h4>
              <div className="p-4 bg-slate-50 dark:bg-zinc-900 rounded-xl border border-slate-100 dark:border-zinc-800">
                <p className="text-slate-800 dark:text-zinc-200 leading-relaxed font-semibold">{analysis.styleKo}</p>
                <p className="text-xs text-slate-500 dark:text-zinc-500 mt-2 font-medium italic">{analysis.styleEn}</p>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mb-3 uppercase flex items-center gap-2">목소리 특징</h4>
              <div className="p-4 bg-slate-50 dark:bg-zinc-900 rounded-xl border border-slate-100 dark:border-zinc-800">
                <p className="text-slate-800 dark:text-zinc-200 leading-relaxed font-semibold">{analysis.vocalTextureKo}</p>
                <p className="text-xs text-slate-500 dark:text-zinc-500 mt-2 font-medium italic">{analysis.vocalTextureEn}</p>
              </div>
            </div>
          </div>
        </div>
      </ScrollAnimate>

      <div className="space-y-6">
        <ScrollAnimate><h3 className="text-xl font-bold flex items-center gap-2 px-2 text-slate-800 dark:text-zinc-100">분위기별 프롬프트 제안</h3></ScrollAnimate>
        <div className="grid grid-cols-1 gap-6">
          {analysis.moodVariations.map((variation: MoodVariation, idx: number) => (
            <ScrollAnimate key={idx}>
              <div className="p-6 bg-white dark:bg-softblack-card border border-slate-200 dark:border-zinc-800 rounded-2xl group hover:border-blue-500/40 transition-all relative overflow-hidden">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                  <span className="px-3 py-1 bg-slate-100 dark:bg-zinc-900 rounded-full text-xs font-bold">{variation.mood}</span>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => setSaveFolderIndex(saveFolderIndex === idx ? null : idx)} className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-lg font-bold shadow-sm">저장소 담기</button>
                    <button onClick={() => setSongInputIndex(songInputIndex === idx ? null : idx)} className={`text-xs px-3 py-1.5 rounded-lg border font-bold ${songInputIndex === idx ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-zinc-800 text-slate-700'} shadow-sm`}>곡별 생성</button>
                    <button onClick={() => setInstructionIndex(instructionIndex === idx ? null : idx)} className={`text-xs px-3 py-1.5 rounded-lg border font-bold ${instructionIndex === idx ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-zinc-800 text-indigo-600 border-indigo-200'} shadow-sm`}>AI 정교화</button>
                    <button onClick={() => copyToClipboard(prompts[idx] || '')} className="text-xs bg-slate-800 text-white px-3 py-1.5 rounded-lg font-bold shadow-sm">복사</button>
                  </div>
                </div>

                {saveFolderIndex === idx && (
                  <div className="mb-4 p-4 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 rounded-xl animate-in fade-in slide-in-from-top-2 shadow-sm">
                    <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-2 uppercase">저장할 폴더 선택</p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      <button onClick={() => executeSave(idx)} className="px-3 py-1.5 bg-white dark:bg-zinc-800 border border-emerald-200 dark:border-zinc-700 rounded-lg text-xs font-bold hover:bg-emerald-100">미분류</button>
                      {folders.map(f => (
                        <button key={f.id} onClick={() => executeSave(idx, f.id)} className="px-3 py-1.5 bg-white dark:bg-zinc-800 border border-emerald-200 dark:border-zinc-700 rounded-lg text-xs font-bold hover:bg-emerald-100 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: f.color }}></span> {f.name}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input type="text" value={newFolderName} onChange={e => setNewFolderName(e.target.value)} placeholder="새 폴더 이름..." className="flex-1 text-xs px-3 py-1.5 bg-white dark:bg-zinc-950 border border-emerald-200 rounded-lg focus:outline-none" />
                      <button onClick={() => handleCreateAndSave(idx)} className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm">새 폴더에 저장</button>
                    </div>
                  </div>
                )}

                {songInputIndex === idx && (
                  <div className="mb-4 flex gap-2"><input type="text" value={songQuery} onChange={e => setSongQuery(e.target.value)} placeholder="참고할 곡 제목 입력..." className="flex-1 bg-slate-50 dark:bg-zinc-950 border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" /><button onClick={() => handleGenerateSongSpecific(idx)} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md">생성</button></div>
                )}

                {instructionIndex === idx && (
                  <div className="mb-4 flex gap-2"><input type="text" value={userInstruction} onChange={e => setUserInstruction(e.target.value)} placeholder="요청 사항 입력..." className="flex-1 bg-indigo-50 dark:bg-zinc-950 border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" /><button onClick={() => handleRefine(idx)} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md">실행</button></div>
                )}

                <textarea value={prompts[idx] || ''} onChange={e => handlePromptChange(idx, e.target.value)} rows={3} className="w-full bg-slate-50 dark:bg-zinc-950 p-4 rounded-xl border font-mono text-indigo-700 dark:text-blue-400 text-sm focus:ring-1 focus:ring-blue-500 resize-none shadow-inner" />
              </div>
            </ScrollAnimate>
          ))}
        </div>
      </div>

      <ScrollAnimate className="p-8 bg-white dark:bg-softblack-card border border-slate-200 dark:border-zinc-800 rounded-3xl shadow-xl overflow-hidden">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-slate-800 dark:text-zinc-100">
          <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 4-8 4z"/></svg>
          보컬 데이터 아카이브 (YouTube Search)
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {analysis.representativeSongs.map((song, idx) => {
            const searchQuery = encodeURIComponent(`${analysis.name} ${song.title}`);
            const searchUrl = `https://www.youtube.com/results?search_query=${searchQuery}`;
            
            return (
              <div 
                key={idx}
                className="group p-4 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl transition-all ring-1 ring-slate-100 dark:ring-zinc-800 hover:ring-red-500/30 flex items-center gap-4"
              >
                <div className="w-12 h-12 bg-red-50 dark:bg-red-950/30 rounded-xl flex items-center justify-center text-red-600 dark:text-red-500 transition-transform shadow-sm">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M10 15.5l5.5-3.5L10 8.5v7zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/></svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800 dark:text-zinc-100 truncate">{song.title}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <a 
                      href={searchUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="inline-flex items-center gap-1 text-[10px] font-bold bg-white dark:bg-zinc-800 border border-red-200 dark:border-red-900/30 text-red-600 px-2 py-1 rounded-md hover:bg-red-50 transition-colors shadow-sm"
                    >
                      YouTube 검색 →
                    </a>
                    <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-600 uppercase tracking-tighter flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
                      Verified Ref
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {analysis.sources && analysis.sources.length > 0 && (
          <div className="pt-6 border-t border-slate-100 dark:border-zinc-800">
            <h4 className="text-sm font-bold text-slate-400 dark:text-zinc-600 uppercase mb-4 tracking-widest">분석 데이터 소스 (Grounding Sources)</h4>
            <div className="flex flex-wrap gap-2">
              {analysis.sources.map((source, idx) => (
                <a key={idx} href={source.uri} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs font-bold text-slate-600 dark:text-zinc-400 hover:text-blue-600 transition-colors group">
                  <img src={`https://www.google.com/s2/favicons?domain=${new URL(source.uri).hostname}`} alt="" className="w-3.5 h-3.5 grayscale group-hover:grayscale-0 transition-all" />
                  <span className="max-w-[140px] truncate">{source.title}</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </ScrollAnimate>
    </div>
  );
};

export default AnalysisView;
