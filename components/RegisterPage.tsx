import React, { useState } from "react";
import { registerUser } from "../authService";
import { User } from "../types";
import SocialLoginButtons from "./SocialLoginButtons";

interface RegisterPageProps {
  onRegister: (user: User) => void;
  onLogin: () => void;
}

const RegisterPage: React.FC<RegisterPageProps> = ({ onRegister, onLogin }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      onRegister(await registerUser(name, email, password));
    } catch (err) {
      setError(err instanceof Error ? err.message : "회원가입 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="w-full max-w-md bg-white dark:bg-softblack-card border border-slate-200 dark:border-zinc-800 rounded-3xl p-8 shadow-2xl">
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">회원가입</h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-zinc-500">프론트엔드 localStorage 기반 임시 계정입니다.</p>
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">이름</label>
            <input value={name} onChange={(event) => setName(event.target.value)} className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">이메일</label>
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">비밀번호</label>
            <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm" />
          </div>
          {error && <p className="text-sm font-bold text-red-500">{error}</p>}
          <button disabled={isSubmitting} className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-300 text-white rounded-xl font-bold">
            {isSubmitting ? "생성 중..." : "회원가입"}
          </button>
        </form>
        <div className="relative my-7">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-100 dark:border-zinc-800"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white dark:bg-softblack-card px-3 text-slate-400 dark:text-zinc-600 font-bold">또는</span>
          </div>
        </div>
        <SocialLoginButtons onSuccess={onRegister} />
        <button onClick={onLogin} className="mt-6 w-full text-sm font-bold text-blue-600 dark:text-blue-400">
          이미 계정이 있나요? 로그인
        </button>
      </div>
    </div>
  );
};

export default RegisterPage;
