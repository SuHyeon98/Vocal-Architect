import { saveCurrentUser } from "./authService";
import { User } from "./types";

const SOCIAL_SETUP_MESSAGE = "소셜 로그인 설정이 필요합니다. .env.local에 OAuth/Firebase 설정을 추가해 주세요.";

const hasFirebaseConfig = () => {
  return Boolean(
    import.meta.env.VITE_FIREBASE_API_KEY &&
      import.meta.env.VITE_FIREBASE_AUTH_DOMAIN &&
      import.meta.env.VITE_FIREBASE_PROJECT_ID &&
      import.meta.env.VITE_FIREBASE_APP_ID,
  );
};

export const signInWithGoogle = async (): Promise<User> => {
  if (!hasFirebaseConfig()) {
    throw new Error(SOCIAL_SETUP_MESSAGE);
  }

  const [{ initializeApp, getApps }, { getAuth, GoogleAuthProvider, signInWithPopup }] = await Promise.all([
    import("firebase/app"),
    import("firebase/auth"),
  ]);

  const app =
    getApps()[0] ??
    initializeApp({
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    });

  const auth = getAuth(app);
  const result = await signInWithPopup(auth, new GoogleAuthProvider());
  const firebaseUser = result.user;

  const user: User = {
    id: `google_${firebaseUser.uid}`,
    email: firebaseUser.email ?? "",
    name: firebaseUser.displayName ?? firebaseUser.email ?? "Google User",
    photoURL: firebaseUser.photoURL,
    provider: "google",
  };

  saveCurrentUser(user);
  return user;
};

export const signInWithKakao = async (): Promise<User> => {
  if (!import.meta.env.VITE_KAKAO_CLIENT_ID) {
    throw new Error(SOCIAL_SETUP_MESSAGE);
  }

  throw new Error("Kakao 로그인은 백엔드 OAuth 프록시 또는 Firebase Custom Auth 연결이 필요합니다.");
};

export const signInWithNaver = async (): Promise<User> => {
  if (!import.meta.env.VITE_NAVER_CLIENT_ID) {
    throw new Error(SOCIAL_SETUP_MESSAGE);
  }

  throw new Error("Naver 로그인은 백엔드 OAuth 프록시 또는 Firebase Custom Auth 연결이 필요합니다.");
};
