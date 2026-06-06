import React, { useEffect, useRef, useState } from "react";
import { getCurrentUser, logoutUser } from "./authService";
import { analyzeSinger, GEMINI_API_KEY_MISSING_MESSAGE, isGeminiApiKeyMissingError } from "./geminiService";
import { AppStatus, Folder, HistoryItem, SavedLyric, SavedPrompt, ScoreDraft, SingerAnalysis, User } from "./types";
import AnalysisView from "./components/AnalysisView";
import AudioTranscriber from "./components/AudioTranscriber";
import Header from "./components/Header";
import LoadingSpinner from "./components/LoadingSpinner";
import LoginPage from "./components/LoginPage";
import LyricArchitectPage from "./components/LyricArchitectPage";
import PublicHomePage from "./components/PublicHomePage";
import RegisterPage from "./components/RegisterPage";
import SavedPrompts from "./components/SavedPrompts";
import SavedPromptsPage from "./components/SavedPromptsPage";
import ScoreArchitectPage from "./components/ScoreArchitectPage";
import SearchBar from "./components/SearchBar";
import SearchHistory from "./components/SearchHistory";

const HISTORY_STORAGE_KEY = "vocal_architect_history_v2";
const SAVED_PROMPTS_STORAGE_KEY = "vocal_architect_saved_prompts_v2";
const SAVED_LYRICS_STORAGE_KEY = "vocal_architect_saved_lyrics_v2";
const FOLDERS_STORAGE_KEY = "vocal_architect_folders_v2";
const THEME_STORAGE_KEY = "vocal_architect_theme";

export type ViewType = "public-home" | "login" | "register" | "home" | "lyric-editor" | "score-architect" | "library";

export interface LyricDraft {
  title: string;
  genre: string;
  mood: string;
  keywords: string;
  referenceArtist: string;
  sections: string[];
  artistId: string;
  raw: string;
  structured: string;
}

const PROTECTED_VIEWS: ViewType[] = ["home", "lyric-editor", "score-architect", "library"];
const USER_SCOPED_KEYS = [HISTORY_STORAGE_KEY, SAVED_PROMPTS_STORAGE_KEY, SAVED_LYRICS_STORAGE_KEY, FOLDERS_STORAGE_KEY];

const readJson = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const userStorageKey = (baseKey: string, userId: string) => `${baseKey}_${userId}`;

const migrateLegacyData = (userId: string) => {
  USER_SCOPED_KEYS.forEach((baseKey) => {
    const scopedKey = userStorageKey(baseKey, userId);
    if (!localStorage.getItem(scopedKey)) {
      const legacyValue = localStorage.getItem(baseKey);
      if (legacyValue) localStorage.setItem(scopedKey, legacyValue);
    }
  });
};

const createInitialLyricDraft = (): LyricDraft => ({
  title: "",
  genre: "K-Pop",
  mood: "사랑",
  keywords: "",
  referenceArtist: "",
  sections: ["Verse", "Pre-Chorus", "Chorus"],
  artistId: "",
  raw: "",
  structured: "",
});

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => getCurrentUser());
  const [activeView, setActiveView] = useState<ViewType>(() => (getCurrentUser() ? "home" : "public-home"));
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [analysis, setAnalysis] = useState<SingerAnalysis | null>(null);
  const [activePrompts, setActivePrompts] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [savedPrompts, setSavedPrompts] = useState<SavedPrompt[]>([]);
  const [savedLyrics, setSavedLyrics] = useState<SavedLyric[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [lyricDraft, setLyricDraft] = useState<LyricDraft>(() => createInitialLyricDraft());
  const [scoreDraft, setScoreDraft] = useState<ScoreDraft | null>(null);
  const isLoadingUserDataRef = useRef(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialTheme = savedTheme ? savedTheme === "dark" : prefersDark;
    setIsDarkMode(initialTheme);
    document.documentElement.classList.toggle("dark", initialTheme);
  }, []);

  useEffect(() => {
    isLoadingUserDataRef.current = true;

    if (!currentUser) {
      setHistory([]);
      setSavedPrompts([]);
      setSavedLyrics([]);
      setFolders([]);
      setAnalysis(null);
      setActivePrompts([]);
      setStatus(AppStatus.IDLE);
      setError(null);
      isLoadingUserDataRef.current = false;
      return;
    }

    migrateLegacyData(currentUser.id);
    setHistory(readJson<HistoryItem[]>(userStorageKey(HISTORY_STORAGE_KEY, currentUser.id), []));
    setSavedPrompts(readJson<SavedPrompt[]>(userStorageKey(SAVED_PROMPTS_STORAGE_KEY, currentUser.id), []));
    setSavedLyrics(readJson<SavedLyric[]>(userStorageKey(SAVED_LYRICS_STORAGE_KEY, currentUser.id), []));
    setFolders(readJson<Folder[]>(userStorageKey(FOLDERS_STORAGE_KEY, currentUser.id), []));

    window.setTimeout(() => {
      isLoadingUserDataRef.current = false;
    }, 0);
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser || isLoadingUserDataRef.current) return;
    localStorage.setItem(userStorageKey(HISTORY_STORAGE_KEY, currentUser.id), JSON.stringify(history));
  }, [history, currentUser]);

  useEffect(() => {
    if (!currentUser || isLoadingUserDataRef.current) return;
    localStorage.setItem(userStorageKey(SAVED_PROMPTS_STORAGE_KEY, currentUser.id), JSON.stringify(savedPrompts));
  }, [savedPrompts, currentUser]);

  useEffect(() => {
    if (!currentUser || isLoadingUserDataRef.current) return;
    localStorage.setItem(userStorageKey(SAVED_LYRICS_STORAGE_KEY, currentUser.id), JSON.stringify(savedLyrics));
  }, [savedLyrics, currentUser]);

  useEffect(() => {
    if (!currentUser || isLoadingUserDataRef.current) return;
    localStorage.setItem(userStorageKey(FOLDERS_STORAGE_KEY, currentUser.id), JSON.stringify(folders));
  }, [folders, currentUser]);

  const handleViewChange = (newView: ViewType) => {
    if (PROTECTED_VIEWS.includes(newView) && !currentUser) {
      setActiveView("login");
    } else {
      setActiveView(newView);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleAuthenticated = (user: User) => {
    setCurrentUser(user);
    setActiveView("home");
  };

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
    setLyricDraft(createInitialLyricDraft());
    setScoreDraft(null);
    setActiveView("public-home");
  };

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem(THEME_STORAGE_KEY, newTheme ? "dark" : "light");
    document.documentElement.classList.toggle("dark", newTheme);
  };

  const handleSearch = async (name: string) => {
    if (!currentUser) {
      handleViewChange("login");
      return;
    }
    if (!name.trim()) return;

    handleViewChange("home");
    setStatus(AppStatus.LOADING);
    setError(null);
    try {
      const result = await analyzeSinger(name);
      setAnalysis(result);
      setActivePrompts(result.moodVariations.map((variation) => variation.prompt));
      const newHistoryItem: HistoryItem = { ...result, id: crypto.randomUUID(), timestamp: Date.now() };
      setHistory((prev) => {
        const filtered = prev.filter((item) => item.name.toLowerCase() !== result.name.toLowerCase());
        return [newHistoryItem, ...filtered].slice(0, 10);
      });
      setStatus(AppStatus.SUCCESS);
    } catch (err) {
      console.error("Singer analysis failed:", err instanceof Error ? err.name : "UnknownError");
      setError(isGeminiApiKeyMissingError(err) ? GEMINI_API_KEY_MISSING_MESSAGE : "가수 분석에 실패했습니다.");
      setStatus(AppStatus.ERROR);
    }
  };

  const handleSavePrompt = (singerName: string, mood: string, prompt: string, folderId?: string) => {
    if (!currentUser) return;
    const newSaved: SavedPrompt = { id: crypto.randomUUID(), singerName, mood, prompt, timestamp: Date.now(), folderId };
    setSavedPrompts((prev) => [newSaved, ...prev]);
  };

  const handleUpdateSavedPrompt = (id: string, newText: string, folderId?: string) => {
    setSavedPrompts((prev) => prev.map((prompt) => (prompt.id === id ? { ...prompt, prompt: newText, folderId: folderId ?? prompt.folderId } : prompt)));
  };

  const handleSaveLyric = (title: string, singerName: string | null, rawLyrics: string, structuredLyrics: string, folderId?: string) => {
    if (!currentUser) return;
    const newSaved: SavedLyric = {
      id: crypto.randomUUID(),
      title,
      singerName,
      rawLyrics,
      structuredLyrics,
      timestamp: Date.now(),
      folderId,
      userId: currentUser.id,
    };
    setSavedLyrics((prev) => [newSaved, ...prev]);
  };

  const handleCreateFolder = (name: string, color: string) => {
    const newFolder: Folder = { id: crypto.randomUUID(), name, color, timestamp: Date.now() };
    setFolders((prev) => [...prev, newFolder]);
    return newFolder.id;
  };

  const handleDeleteFolder = (id: string) => {
    if (window.confirm("폴더를 삭제하시겠습니까? 폴더 안의 항목은 미분류 상태로 유지됩니다.")) {
      setFolders((prev) => prev.filter((folder) => folder.id !== id));
      setSavedPrompts((prev) => prev.map((prompt) => (prompt.folderId === id ? { ...prompt, folderId: undefined } : prompt)));
      setSavedLyrics((prev) => prev.map((lyric) => (lyric.folderId === id ? { ...lyric, folderId: undefined } : lyric)));
    }
  };

  const handleSelectHistory = (item: HistoryItem) => {
    setAnalysis(item);
    setActivePrompts(item.moodVariations.map((variation) => variation.prompt));
    setStatus(AppStatus.SUCCESS);
    handleViewChange("home");
  };

  const renderHome = () => (
    <div className="space-y-12">
      <div className="mb-12">
        <SearchBar onSearch={handleSearch} isLoading={status === AppStatus.LOADING} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          {status === AppStatus.LOADING && (
            <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-softblack-card rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-xl">
              <LoadingSpinner />
              <p className="mt-4 text-slate-500 dark:text-zinc-400 animate-pulse">보컬 데이터를 분석하는 중입니다...</p>
            </div>
          )}
          {status === AppStatus.SUCCESS && analysis && (
            <AnalysisView
              analysis={analysis}
              prompts={activePrompts}
              onPromptsChange={setActivePrompts}
              onSavePrompt={handleSavePrompt}
              folders={folders}
              onCreateFolder={handleCreateFolder}
            />
          )}
          {status === AppStatus.ERROR && error && (
            <div className="p-6 bg-amber-50 dark:bg-amber-950/20 rounded-3xl border border-amber-200 dark:border-amber-900/40 text-amber-900 dark:text-amber-200 shadow-xl">
              <p className="text-sm font-bold">{error}</p>
            </div>
          )}
          {status === AppStatus.IDLE && (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <div className="w-24 h-24 bg-blue-50 dark:bg-zinc-950 rounded-full flex items-center justify-center mb-8 border border-blue-100 dark:border-white/5">
                <svg className="w-12 h-12 text-blue-600 dark:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-2 text-slate-800 dark:text-zinc-100">분석할 가수를 입력하세요</h2>
              <p className="text-slate-500 dark:text-zinc-400 max-w-sm mx-auto">
                보컬 특징과 음악 스타일을 분석해 Suno 프롬프트를 생성합니다.
              </p>
            </div>
          )}
        </div>
        <div className="lg:col-span-4 space-y-8">
          <SavedPrompts prompts={savedPrompts.slice(0, 3)} onDelete={(id) => setSavedPrompts((prev) => prev.filter((prompt) => prompt.id !== id))} onViewMore={() => handleViewChange("library")} />
          <SearchHistory history={history} onSelect={handleSelectHistory} onDelete={(id) => setHistory((prev) => prev.filter((item) => item.id !== id))} />
          <AudioTranscriber />
        </div>
      </div>
    </div>
  );

  const renderView = () => {
    switch (activeView) {
      case "public-home":
        return <PublicHomePage onLogin={() => handleViewChange("login")} onRegister={() => handleViewChange("register")} />;
      case "login":
        return <LoginPage onLogin={handleAuthenticated} onRegister={() => handleViewChange("register")} />;
      case "register":
        return <RegisterPage onRegister={handleAuthenticated} onLogin={() => handleViewChange("login")} />;
      case "library":
        return (
          <SavedPromptsPage
            prompts={savedPrompts}
            lyrics={savedLyrics}
            folders={folders}
            onDeletePrompt={(id) => setSavedPrompts((prev) => prev.filter((prompt) => prompt.id !== id))}
            onDeleteLyric={(id) => setSavedLyrics((prev) => prev.filter((lyric) => lyric.id !== id))}
            onUpdatePrompt={handleUpdateSavedPrompt}
            onCreateFolder={handleCreateFolder}
            onDeleteFolder={handleDeleteFolder}
            onBack={() => handleViewChange("home")}
          />
        );
      case "lyric-editor":
        return currentUser ? (
          <LyricArchitectPage
            currentUser={currentUser}
            onBack={() => handleViewChange("home")}
            onSaveLyric={handleSaveLyric}
            artistHistory={history}
            folders={folders}
            draft={lyricDraft}
            onDraftChange={setLyricDraft}
          />
        ) : null;
      case "score-architect":
        return <ScoreArchitectPage onBack={() => handleViewChange("home")} draft={scoreDraft} onDraftChange={setScoreDraft} />;
      case "home":
      default:
        return renderHome();
    }
  };

  return (
    <div className="min-h-screen transition-colors duration-300">
      <Header
        activeView={activeView}
        onViewChange={handleViewChange}
        savedCount={savedPrompts.length + savedLyrics.length}
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
        currentUser={currentUser}
        onLogin={() => handleViewChange("login")}
        onRegister={() => handleViewChange("register")}
        onLogout={handleLogout}
      />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl overflow-x-hidden">
        <div key={activeView} className="animate-in fade-in duration-500 ease-out fill-mode-forwards">
          {renderView()}
        </div>
      </main>
      <footer className="py-8 border-t border-slate-200 dark:border-zinc-800 text-center text-slate-400 dark:text-zinc-600 text-sm">
        <p>© 2024 Vocal Architect - AI Powered Vocal Analysis</p>
      </footer>
    </div>
  );
};

export default App;
