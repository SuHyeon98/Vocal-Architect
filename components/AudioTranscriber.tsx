
import React, { useState, useRef } from 'react';
import { transcribeAudio } from '../geminiService';
import LoadingSpinner from './LoadingSpinner';

const AudioTranscriber: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = (reader.result as string).split(',')[1];
          setIsProcessing(true);
          try {
            const text = await transcribeAudio(base64Audio);
            setTranscription(text);
          } catch (err) {
            console.error(err);
            setTranscription("Transcription failed. Please try again.");
          } finally {
            setIsProcessing(false);
          }
        };
      };

      mediaRecorder.start();
      setIsRecording(true);
      setTranscription(null);
    } catch (err) {
      console.error("Mic access denied:", err);
      alert("Please allow microphone access to use this feature.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  return (
    <div className="p-6 bg-white dark:bg-softblack-card rounded-3xl border border-slate-200 dark:border-zinc-800 backdrop-blur-sm shadow-xl dark:shadow-2xl">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-800 dark:text-zinc-100">
        <svg className="w-5 h-5 text-blue-600 dark:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
        Vocal Transcriber
      </h3>
      
      <p className="text-sm text-slate-500 dark:text-zinc-500 mb-6">보컬 레퍼런스를 녹음하면 가사와 프레이징을 분석해 텍스트로 변환합니다.</p>

      <div className="flex flex-col items-center gap-6">
        <button
          onMouseDown={startRecording}
          onMouseUp={stopRecording}
          onTouchStart={startRecording}
          onTouchEnd={stopRecording}
          className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl ${
            isRecording 
              ? 'bg-red-500 scale-110 shadow-red-500/50' 
              : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/30 dark:shadow-blue-900/40'
          } disabled:opacity-50`}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <LoadingSpinner size="sm" />
          ) : (
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
            </svg>
          )}
          {isRecording && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
            </span>
          )}
        </button>
        <span className="text-xs font-bold text-slate-400 dark:text-zinc-600 uppercase tracking-tighter">
          {isRecording ? 'Release to Transcribe' : 'Hold to Record'}
        </span>
      </div>

      {transcription && (
        <div className="mt-6 p-4 bg-slate-50 dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-inner">
          <h4 className="text-xs font-bold text-slate-400 dark:text-zinc-600 uppercase mb-2">Transcription Output</h4>
          <p className="text-sm text-slate-700 dark:text-zinc-200 leading-relaxed font-medium">"{transcription}"</p>
        </div>
      )}
    </div>
  );
};

export default AudioTranscriber;
