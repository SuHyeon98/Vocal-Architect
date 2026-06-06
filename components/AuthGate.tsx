import React from "react";
import { User } from "../types";

interface AuthGateProps {
  user: User | null;
  onLogin: () => void;
  children: React.ReactNode;
}

const AuthGate: React.FC<AuthGateProps> = ({ user, onLogin, children }) => {
  if (user) return <>{children}</>;

  return (
    <div className="min-h-[60vh] flex items-center justify-center text-center">
      <div className="max-w-md bg-white dark:bg-softblack-card border border-slate-200 dark:border-zinc-800 rounded-3xl p-8 shadow-2xl">
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">로그인이 필요합니다</h2>
        <p className="mt-3 text-sm text-slate-500 dark:text-zinc-500 leading-6">
          분석, 작사, 가사, 악보, 저장소, Vocal Transcriber는 회원 전용 기능입니다.
        </p>
        <button onClick={onLogin} className="mt-6 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold">
          로그인하러 가기
        </button>
      </div>
    </div>
  );
};

export default AuthGate;
