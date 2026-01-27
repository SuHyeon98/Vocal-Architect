
import React, { useState, useRef, useEffect } from 'react';
import abcjs from 'abcjs';
import { generateScoreFromAudio } from '../geminiService';
import { ScoreDraft } from '../types';
import LoadingSpinner from './LoadingSpinner';

interface ScoreArchitectPageProps {
  onBack: () => void;
  draft: ScoreDraft | null;
  onDraftChange: (draft: ScoreDraft | null) => void;
}

const ScoreArchitectPage: React.FC<ScoreArchitectPageProps> = ({ onBack, draft, onDraftChange }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [abcText, setAbcText] = useState(draft?.abcNotation || '');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scoreContainerRef = useRef<HTMLDivElement>(null);
  const midiContainerRef = useRef<HTMLDivElement>(null);

  // Sync internal text with draft prop
  useEffect(() => {
    if (draft) {
      setAbcText(draft.abcNotation);
    }
  }, [draft]);

  // Render score whenever abcText changes
  useEffect(() => {
    if (abcText && scoreContainerRef.current) {
      abcjs.renderAbc(scoreContainerRef.current, abcText, {
        responsive: 'resize',
        add_classes: true,
        paddingtop: 0,
        paddingbottom: 0,
        paddingright: 0,
        paddingleft: 0
      });

      // Playback init (simple version using abcjs synth)
      if (abcjs.synth.supportsAudio() && midiContainerRef.current) {
        const visualObj = abcjs.renderAbc(scoreContainerRef.current, abcText, { responsive: 'resize' })[0];
        const synthControl = new abcjs.synth.SynthController();
        synthControl.load(midiContainerRef.current, null, {
          displayLoop: true,
          displayRestart: true,
          displayPlay: true,
          displayProgress: true,
          displayWarp: true
        });
        
        const midiBuffer = new abcjs.synth.CreateSynth();
        midiBuffer.init({ visualObj }).then(() => {
          synthControl.setTune(visualObj, false).then(() => {
            console.log("Audio ready");
          });
        });
      }
    }
  }, [abcText]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const processAudio = async () => {
    if (!file) return;
    setIsProcessing(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(',')[1];
        const result = await generateScoreFromAudio(base64Audio, file.type);
        const newDraft = {
          fileName: file.name,
          abcNotation: result.abc,
          analysis: result.analysis
        };
        onDraftChange(newDraft);
        setAbcText(result.abc);
        setIsProcessing(false);
      };
    } catch (err) {
      console.error(err);
      alert("오디오 분석 중 오류가 발생했습니다.");
      setIsProcessing(false);
    }
  };

  const downloadAbc = () => {
    if (!abcText) return;
    const element = document.createElement("a");
    const fileBlob = new Blob([abcText], { type: 'text/plain' });
    element.href = URL.createObjectURL(fileBlob);
    element.download = `${draft?.fileName?.split('.')[0] || 'score'}_transcription.abc`;
    document.body.appendChild(element);
    element.click();
  };

  const handleAbcChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setAbcText(newText);
    if (draft) {
      onDraftChange({ ...draft, abcNotation: newText });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <button onClick={onBack} className="text-sm font-bold text-slate-500 uppercase flex items-center gap-2 hover:text-slate-800 dark:hover:text-white transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Back to Home
        </button>
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">Score Architect <span className="text-rose-600">Workbench</span></h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Upload & Controls */}
        <div className="lg:col-span-4 space-y-6">
          <div 
            className={`p-8 border-2 border-dashed rounded-3xl transition-all flex flex-col items-center justify-center text-center cursor-pointer ${
              file ? 'border-rose-500 bg-rose-50/30 dark:bg-rose-950/10' : 'border-slate-200 dark:border-zinc-800 hover:border-rose-500/50 dark:hover:border-rose-500/50'
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="audio/*" 
              className="hidden" 
            />
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-colors ${file ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 dark:bg-zinc-900 text-slate-400'}`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" /></svg>
            </div>
            {file ? (
              <div className="min-w-0 w-full px-2">
                <p className="text-sm font-bold text-slate-800 dark:text-zinc-200 truncate">{file.name}</p>
                <p className="text-xs text-slate-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
              </div>
            ) : (
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-zinc-200">오디오 파일 업로드</p>
                <p className="text-xs text-slate-500 mt-1">MP3, WAV, M4A 지원</p>
              </div>
            )}
          </div>

          <button 
            onClick={processAudio} 
            disabled={!file || isProcessing}
            className="w-full py-4 bg-rose-600 hover:bg-rose-500 disabled:bg-slate-300 text-white rounded-2xl font-bold shadow-lg shadow-rose-600/20 transition-all flex items-center justify-center gap-3"
          >
            {isProcessing ? (
              <>
                <LoadingSpinner size="sm" />
                <span>AI 음악 분석 중...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                <span>AI 악보 생성하기</span>
              </>
            )}
          </button>

          {draft && (
            <div className="p-6 bg-white dark:bg-softblack-card border border-slate-200 dark:border-zinc-800 rounded-3xl space-y-4 animate-in slide-in-from-left-4">
              <h4 className="text-xs font-bold text-rose-600 uppercase tracking-widest flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                AI 음악적 분석
              </h4>
              <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed italic">
                {draft.analysis}
              </p>
            </div>
          )}
          
          <div className="p-6 bg-slate-100 dark:bg-zinc-900/50 rounded-3xl space-y-3">
             <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Transcription Tips</h4>
             <ul className="text-[11px] text-slate-500 dark:text-zinc-500 space-y-2">
               <li>• <b>ABC 에디터</b>에서 가사나 음정을 직접 수정할 수 있습니다.</li>
               <li>• 수정한 내용은 하단 <b>실시간 악보</b>에 즉시 반영됩니다.</li>
               <li>• <b>오디오 플레이어</b>로 작성된 악보를 소리로 확인하세요.</li>
             </ul>
          </div>
        </div>

        {/* Right Column: Editor & Rendering */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white dark:bg-softblack-card border border-slate-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            <div className="p-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-slate-50/50 dark:bg-zinc-900/50">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">ABC Transcription Tool</span>
                <div className="h-4 w-[1px] bg-slate-200 dark:bg-zinc-700"></div>
                {draft && <span className="text-[10px] font-mono text-rose-500 font-bold uppercase">{draft.fileName}</span>}
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={downloadAbc}
                  disabled={!abcText}
                  className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-bold hover:bg-slate-700 disabled:opacity-50 transition-colors shadow-lg shadow-black/10"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  Export .abc
                </button>
              </div>
            </div>
            
            <div className="p-0">
               <textarea 
                  value={abcText} 
                  onChange={handleAbcChange}
                  placeholder="오디오를 업로드하거나 여기에 ABC Notation을 직접 입력하세요..."
                  className="w-full h-48 p-6 font-mono text-sm bg-zinc-950 text-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 resize-none placeholder:text-zinc-800"
               />
            </div>

            <div className="p-4 bg-zinc-900 border-t border-zinc-800 flex items-center gap-4 min-h-[60px]">
              <div id="midi-player" ref={midiContainerRef} className="w-full overflow-hidden"></div>
              {!abcText && <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-wider mx-auto">Playback ready after analysis</span>}
            </div>

            <div className="flex-1 bg-white dark:bg-zinc-900 p-6 overflow-y-auto min-h-[400px] border-t border-slate-100 dark:border-zinc-800">
              <div className="mb-4 flex items-center justify-between">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Live Score Sheet</h4>
                {abcText && <span className="text-[9px] text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full uppercase">Rendered SVG</span>}
              </div>
              
              <div id="score-render" ref={scoreContainerRef} className="w-full">
                {!abcText && (
                  <div className="h-48 flex flex-col items-center justify-center text-slate-300 dark:text-zinc-700 space-y-4">
                    <svg className="w-12 h-12 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" /></svg>
                    <p className="text-xs font-medium uppercase tracking-tighter">Waiting for musical data...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScoreArchitectPage;
