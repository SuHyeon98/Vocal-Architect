import { User } from "./types";

const USERS_STORAGE_KEY = "vocal_architect_users_v1";
const CURRENT_USER_STORAGE_KEY = "vocal_architect_current_user";

interface StoredUser extends User {
  passwordHash: string;
  createdAt: number;
}

const readUsers = (): StoredUser[] => {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredUser[]) : [];
  } catch {
    return [];
  }
};

const writeUsers = (users: StoredUser[]) => {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
};

// Temporary frontend-only auth for local development.
// This is not production security. Use Firebase Auth, Supabase Auth, NextAuth,
// or a backend session system before shipping real accounts.
export const hashPassword = async (password: string): Promise<string> => {
  const bytes = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

export const getCurrentUser = (): User | null => {
  try {
    const raw = localStorage.getItem(CURRENT_USER_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
    return null;
  }
};

export const saveCurrentUser = (user: User) => {
  localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(user));
};

export const registerUser = async (name: string, email: string, password: string): Promise<User> => {
  const normalizedEmail = email.trim().toLowerCase();
  const trimmedName = name.trim();

  if (!trimmedName || !normalizedEmail || !password) {
    throw new Error("이름, 이메일, 비밀번호를 모두 입력해 주세요.");
  }

  const users = readUsers();
  if (users.some((user) => user.email.toLowerCase() === normalizedEmail)) {
    throw new Error("이미 가입된 이메일입니다.");
  }

  const user: StoredUser = {
    id: crypto.randomUUID(),
    name: trimmedName,
    email: normalizedEmail,
    passwordHash: await hashPassword(password),
    createdAt: Date.now(),
  };

  writeUsers([...users, user]);
  const publicUser: User = { id: user.id, name: user.name, email: user.email, provider: "email" };
  saveCurrentUser(publicUser);
  return publicUser;
};

export const loginUser = async (email: string, password: string): Promise<User> => {
  const normalizedEmail = email.trim().toLowerCase();
  const passwordHash = await hashPassword(password);
  const user = readUsers().find(
    (item) => item.email.toLowerCase() === normalizedEmail && item.passwordHash === passwordHash,
  );

  if (!user) {
    throw new Error("이메일 또는 비밀번호가 올바르지 않습니다.");
  }

  const publicUser: User = { id: user.id, name: user.name, email: user.email, provider: "email" };
  saveCurrentUser(publicUser);
  return publicUser;
};

export const logoutUser = () => {
  localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
};
