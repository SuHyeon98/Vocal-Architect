import React, { useState } from "react";
import { signInWithGoogle, signInWithKakao, signInWithNaver } from "../firebaseAuthService";
import { User } from "../types";

interface SocialLoginButtonsProps {
  onSuccess: (user: User) => void;
}

const SocialLoginButtons: React.FC<SocialLoginButtonsProps> = ({ onSuccess }) => {
  const [error, setError] = useState("");
  const [loadingProvider, setLoadingProvider] = useState<User["provider"] | null>(null);

  const run = async (provider: Exclude<User["provider"], "email" | undefined>, action: () => Promise<User>) => {
    setError("");
    setLoadingProvider(provider);
    try {
      onSuccess(await action());
    } catch (err) {
      setError(err instanceof Error ? err.message : "소셜 로그인 중 오류가 발생했습니다.");
    } finally {
      setLoadingProvider(null);
    }
  };

  const buttonClass = "w-full flex items-center justify-center gap-3 py-3 border rounded-xl text-sm font-bold transition-all active:scale-[0.98] disabled:opacity-60";

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => run("google", signInWithGoogle)}
        disabled={loadingProvider !== null}
        className={`${buttonClass} bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800`}
      >
        <span className="w-5 h-5 rounded-full bg-white text-blue-600 font-black">G</span>
        {loadingProvider === "google" ? "Google 연결 중..." : "Google로 계속하기"}
      </button>
      <button
        type="button"
        onClick={() => run("kakao", signInWithKakao)}
        disabled={loadingProvider !== null}
        className={`${buttonClass} bg-[#FEE500] hover:bg-[#FADB00] border-transparent text-[#191919]`}
      >
        <span className="w-5 h-5 rounded-full bg-[#191919] text-[#FEE500] text-xs flex items-center justify-center font-black">K</span>
        {loadingProvider === "kakao" ? "카카오 연결 중..." : "카카오로 계속하기"}
      </button>
      <button
        type="button"
        onClick={() => run("naver", signInWithNaver)}
        disabled={loadingProvider !== null}
        className={`${buttonClass} bg-[#03C75A] hover:bg-[#02b351] border-transparent text-white`}
      >
        <span className="w-5 h-5 rounded bg-white text-[#03C75A] text-xs flex items-center justify-center font-black">N</span>
        {loadingProvider === "naver" ? "네이버 연결 중..." : "네이버로 계속하기"}
      </button>
      {error && <p className="text-xs font-bold text-amber-600 dark:text-amber-300 whitespace-pre-wrap">{error}</p>}
    </div>
  );
};

export default SocialLoginButtons;
