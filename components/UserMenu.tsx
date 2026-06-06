import React from "react";
import { User } from "../types";

interface UserMenuProps {
  user: User;
  onLogout: () => void;
}

const UserMenu: React.FC<UserMenuProps> = ({ user, onLogout }) => {
  return (
    <div className="hidden sm:flex items-center gap-2">
      <div className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
        <p className="text-xs font-bold text-slate-800 dark:text-zinc-100 truncate max-w-[120px]">{user.name}</p>
      </div>
      <button
        onClick={onLogout}
        className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-900 text-xs font-bold text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-800 transition-all border border-slate-200 dark:border-zinc-800"
      >
        로그아웃
      </button>
    </div>
  );
};

export default UserMenu;
