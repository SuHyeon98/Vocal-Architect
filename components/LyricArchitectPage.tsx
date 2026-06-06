import React, { useState } from "react";
import {
  GEMINI_API_KEY_MISSING_MESSAGE,
  GEMINI_LYRICS_API_KEY_MISSING_MESSAGE,
  generateLyrics,
  isGeminiApiKeyMissingError,
  structureLyrics,
} from "../geminiService";
import { Folder, HistoryItem, User } from "../types";
import { LyricDraft } from "../App";
import LoadingSpinner from "./LoadingSpinner";

interface LyricArchitectPageProps {
  currentUser: User;
  onBack: () => void;
  onSaveLyric: (title: string, singerName: string | null, raw: string, structured: string, folderId?: string) => void;
  artistHistory: HistoryItem[];
  folders: Folder[];
  draft: LyricDraft;
  onDraftChange: (draft: LyricDraft) => void;
}

const GENRES = ["발라드", "K-Pop", "J-Pop", "Rock", "EDM", "Hip-Hop", "CCM"];
const MOODS = ["사랑", "이별", "그리움", "희망", "위로", "청춘", "신앙"];
const SECTIONS = ["Verse", "Pre-Chorus", "Chorus", "Bridge", "Final Chorus"];

const buildPromptSummary = (draft: LyricDraft) => {
  return [
    `곡 제목: ${draft.title || "무제"}`,
    `장르: ${draft.genre}`,
    `분위기: ${draft.mood}`,
    `키워드: ${draft.keywords || "없음"}`,
    `참고 아티스트: ${draft.referenceArtist || "없음"}`,
    `곡 구조: ${draft.sections.join(", ") || "선택 없음"}`,
  ].join("\n");
};

const LyricArchitectPage: React.FC<LyricArchitectPageProps> = ({
  currentUser,
  onBack,
  onSaveLyric,
  artistHistory,
  folders,
  draft,
  onDraftChange,
}) => {
  const [mode, setMode] = useState<"compose" | "structure">("compose");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isStructuring, setIsStructuring] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showFolderSelect, setShowFolderSelect] = useState(false);

  const updateDraft = (updates: Partial<LyricDraft>) => {
    onDraftChange({ ...draft, ...updates });
  };

  const toggleSection = (section: string) => {
    const exists = draft.sections.includes(section);
    updateDraft({
      sections: exists ? draft.sections.filter((item) => item !== section) : [...draft.sections, section],
    });
  };

  const handleGenerate = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    setMessage(null);

    try {
      const lyrics = await generateLyrics({
        title: draft.title,
        genre: draft.genre,
        mood: draft.mood,
        keywords: draft.keywords,
        referenceArtist: draft.referenceArtist,
        sections: draft.sections,
      });

      updateDraft({
        raw: buildPromptSummary(draft),
        structured: lyrics,
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "AI 작사 생성 중 오류가 발생했습니다.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStructure = async () => {
    if (!draft.raw.trim() || isStructuring) return;
    setIsStructuring(true);
    setMessage(null);

    try {
      const selectedArtist = artistHistory.find((artist) => artist.id === draft.artistId);
      const result = await structureLyrics(
        draft.raw,
        selectedArtist
          ? {
              name: selectedArtist.name,
              style: selectedArtist.styleKo,
              texture: selectedArtist.vocalTextureKo,
            }
          : undefined,
      );
      updateDraft({ structured: result });
    } catch (error) {
      setMessage(isGeminiApiKeyMissingError(error) ? GEMINI_API_KEY_MISSING_MESSAGE : "가사 구조화 중 오류가 발생했습니다.");
    } finally {
      setIsStructuring(false);
    }
  };

  const handleSave = (folderId?: string) => {
    const lyrics = draft.structured.trim() || draft.raw.trim();
    if (!lyrics) {
      setMessage("저장할 가사를 입력하거나 생성해 주세요.");
      return;
    }

    const selectedArtist = artistHistory.find((artist) => artist.id === draft.artistId);
    const referenceArtist = draft.referenceArtist.trim() || selectedArtist?.name || null;

    onSaveLyric(
      draft.title.trim() || "무제 가사",
      referenceArtist,
      draft.raw.trim() || lyrics,
      draft.structured.trim() || lyrics,
      folderId,
    );
    setShowFolderSelect(false);
    setMessage("저장소에 저장되었습니다.");
  };

  const saveButton = (
    <div className="relative">
      <button
        onClick={() => setShowFolderSelect((value) => !value)}
        className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold shadow-lg shadow-emerald-600/20"
      >
        저장소에 저장
      </button>
      {showFolderSelect && (
        <div className="absolute top-full mt-2 left-0 right-0 z-20 p-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl space-y-2">
          <button onClick={() => handleSave()} className="w-full text-left text-xs font-bold p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-800">
            미분류
          </button>
          {folders.map((folder) => (
            <button
              key={folder.id}
              onClick={() => handleSave(folder.id)}
              className="w-full text-left text-xs font-bold p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-800 flex items-center gap-2"
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: folder.color }}></span>
              {folder.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm font-bold text-slate-500 dark:text-zinc-500 hover:text-slate-900 dark:hover:text-white uppercase mb-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </button>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">작사 / 가사</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-zinc-500">
            {currentUser.name}님의 작사 초안과 기존 가사 구조화를 함께 관리합니다.
          </p>
        </div>

        <div className="px-4 py-2 rounded-2xl bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 text-xs font-bold text-indigo-700 dark:text-indigo-300">
          Member Workspace
        </div>
      </div>

      <div className="inline-flex p-1 rounded-2xl bg-slate-100 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 shadow-inner">
        <button
          onClick={() => setMode("compose")}
          className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${
            mode === "compose" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" : "text-slate-500 dark:text-zinc-400"
          }`}
        >
          작사
        </button>
        <button
          onClick={() => setMode("structure")}
          className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${
            mode === "structure" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" : "text-slate-500 dark:text-zinc-400"
          }`}
        >
          가사
        </button>
      </div>

      {message && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-sm font-bold text-amber-900 dark:text-amber-200 whitespace-pre-wrap">
          {message}
        </div>
      )}

      {mode === "compose" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <section className="lg:col-span-5 space-y-6">
            <div className="p-6 bg-white dark:bg-softblack-card border border-slate-200 dark:border-zinc-800 rounded-3xl shadow-xl space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-400 dark:text-zinc-600 uppercase mb-2">곡 제목</label>
                <input
                  value={draft.title}
                  onChange={(event) => updateDraft({ title: event.target.value })}
                  placeholder="예: 다시 피는 계절"
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-zinc-600 uppercase mb-2">장르</label>
                  <select
                    value={draft.genre}
                    onChange={(event) => updateDraft({ genre: event.target.value })}
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    {GENRES.map((genre) => (
                      <option key={genre} value={genre}>
                        {genre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-zinc-600 uppercase mb-2">분위기</label>
                  <select
                    value={draft.mood}
                    onChange={(event) => updateDraft({ mood: event.target.value })}
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    {MOODS.map((mood) => (
                      <option key={mood} value={mood}>
                        {mood}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 dark:text-zinc-600 uppercase mb-2">키워드</label>
                <input
                  value={draft.keywords}
                  onChange={(event) => updateDraft({ keywords: event.target.value })}
                  placeholder="예: 새벽, 버스정류장, 오래된 약속"
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 dark:text-zinc-600 uppercase mb-2">참고 아티스트</label>
                <input
                  value={draft.referenceArtist}
                  onChange={(event) => updateDraft({ referenceArtist: event.target.value })}
                  placeholder="예: 아이유, Kenshi Yonezu"
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="p-6 bg-white dark:bg-softblack-card border border-slate-200 dark:border-zinc-800 rounded-3xl shadow-xl space-y-4">
              <h3 className="text-xs font-bold text-slate-400 dark:text-zinc-600 uppercase tracking-widest">곡 구조</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {SECTIONS.map((section) => {
                  const active = draft.sections.includes(section);
                  return (
                    <button
                      key={section}
                      type="button"
                      onClick={() => toggleSection(section)}
                      className={`px-3 py-2 rounded-xl border text-xs font-bold transition-all ${
                        active
                          ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                          : "bg-slate-50 dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 hover:border-indigo-400"
                      }`}
                    >
                      {section}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-300 dark:disabled:bg-zinc-800 text-white rounded-2xl font-bold shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
              >
                {isGenerating ? <LoadingSpinner size="sm" /> : null}
                가사 생성
              </button>
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="py-4 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-300 dark:disabled:bg-zinc-800 text-white rounded-2xl font-bold shadow-lg shadow-slate-800/20"
              >
                다시 생성
              </button>
              {saveButton}
            </div>
          </section>

          <section className="lg:col-span-7">
            <div className="bg-white dark:bg-softblack-card border border-slate-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden">
              <div className="p-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-slate-50/70 dark:bg-zinc-900/50">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Lyrics Draft</span>
                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase">
                  AI + Manual Editable
                </span>
              </div>
              <textarea
                value={draft.structured}
                onChange={(event) => {
                  const value = event.target.value;
                  updateDraft({ structured: value, raw: draft.raw || value });
                }}
                placeholder={`직접 가사를 작성하거나, 왼쪽 조건을 입력한 뒤 가사 생성을 실행하세요.\n\n[Verse]\n...\n\n[Chorus]\n...`}
                className="w-full min-h-[640px] p-6 bg-white dark:bg-zinc-950 text-slate-800 dark:text-zinc-100 font-mono text-sm leading-7 resize-y focus:outline-none"
              />
            </div>
          </section>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <section className="space-y-4">
            <div className="p-6 bg-white dark:bg-softblack-card border border-slate-200 dark:border-zinc-800 rounded-3xl shadow-xl space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-400 dark:text-zinc-600 uppercase mb-2">가사 제목</label>
                <input
                  type="text"
                  value={draft.title}
                  onChange={(event) => updateDraft({ title: event.target.value })}
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 dark:text-zinc-600 uppercase mb-2">아티스트 스타일</label>
                <select
                  value={draft.artistId}
                  onChange={(event) => updateDraft({ artistId: event.target.value })}
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">적용 안 함</option>
                  {artistHistory.map((artist) => (
                    <option key={artist.id} value={artist.id}>
                      {artist.name} 스타일
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <textarea
              value={draft.raw}
              onChange={(event) => updateDraft({ raw: event.target.value })}
              placeholder="여기에 기존 가사를 입력하세요."
              className="w-full h-[400px] bg-white dark:bg-softblack-card border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 text-sm leading-7 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <button
              onClick={handleStructure}
              disabled={!draft.raw.trim() || isStructuring}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-300 dark:disabled:bg-zinc-800 text-white rounded-2xl font-bold shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
            >
              {isStructuring ? <LoadingSpinner size="sm" /> : null}
              Suno AI 구조화
            </button>
          </section>

          <section className="space-y-4">
            <textarea
              value={draft.structured}
              onChange={(event) => updateDraft({ structured: event.target.value })}
              placeholder="구조화 결과가 여기에 표시됩니다. 직접 수정할 수 있습니다."
              className="w-full h-[520px] bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 font-mono text-sm leading-7 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(draft.structured || draft.raw);
                  setMessage("가사가 클립보드에 복사되었습니다.");
                }}
                className="py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-bold shadow-lg shadow-slate-800/20"
              >
                복사
              </button>
              <div className="sm:col-span-2">{saveButton}</div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default LyricArchitectPage;
