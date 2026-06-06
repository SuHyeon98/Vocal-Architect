import React from "react";

interface PublicHomePageProps {
  onLogin: () => void;
  onRegister: () => void;
}

const FEATURES = [
  { title: "보컬 분석", body: "가수의 음색, 발성, 무드별 Suno 프롬프트를 정리합니다." },
  { title: "작사 / 가사", body: "새 가사 생성과 기존 가사의 Suno 구조화를 한 화면에서 관리합니다." },
  { title: "악보", body: "오디오를 기반으로 ABC 악보 초안을 만들고 직접 편집합니다." },
  { title: "저장소", body: "분석 결과, 프롬프트, 가사를 계정별로 분리해 저장합니다." },
];

const PublicHomePage: React.FC<PublicHomePageProps> = ({ onLogin, onRegister }) => {
  return (
    <div className="space-y-10">
      <section className="min-h-[520px] flex items-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7">
            <div className="inline-flex px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-bold mb-5">
              Member-only AI music workspace
            </div>
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-950 dark:text-white">
              Vocal Architect
            </h2>
            <p className="mt-5 text-base sm:text-lg text-slate-600 dark:text-zinc-400 max-w-2xl leading-8">
              보컬 분석, 작사, 가사 구조화, 악보 생성, 저장소를 하나로 묶은 AI 음악 제작 도구입니다.
              주요 기능은 회원 로그인 후 사용할 수 있습니다.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <button onClick={onLogin} className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-600/20">
                로그인
              </button>
              <button onClick={onRegister} className="px-6 py-3 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-100 font-bold">
                회원가입
              </button>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="bg-white dark:bg-softblack-card border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 shadow-2xl">
              <div className="h-44 rounded-2xl bg-slate-950 text-emerald-400 font-mono text-xs p-5 leading-6 overflow-hidden">
                <p>[Vocal DNA]</p>
                <p>airy tone, warm resonance, clean head voice</p>
                <p className="mt-4">[Chorus]</p>
                <p>다시 피는 계절 위로</p>
                <p>너의 이름을 노래해</p>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-3">
                <div className="h-20 rounded-2xl bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30"></div>
                <div className="h-20 rounded-2xl bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30"></div>
                <div className="h-20 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {FEATURES.map((feature) => (
          <div key={feature.title} className="bg-white dark:bg-softblack-card border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xl">
            <h3 className="font-extrabold text-slate-900 dark:text-white">{feature.title}</h3>
            <p className="mt-3 text-sm text-slate-500 dark:text-zinc-500 leading-6">{feature.body}</p>
          </div>
        ))}
      </section>
    </div>
  );
};

export default PublicHomePage;
