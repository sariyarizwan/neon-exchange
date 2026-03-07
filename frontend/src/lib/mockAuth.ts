import type { MockAuthState, MockUser } from "@/types/auth";

export const AUTH_STORAGE_KEY = "neon-exchange-auth";

export const readStoredAuth = (): MockAuthState | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as MockAuthState;
    if (!parsed?.isAuthed || !parsed.user?.displayName || !parsed.user?.avatarId || !parsed.user?.email) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

export const writeStoredAuth = (user: MockUser) => {
  if (typeof window === "undefined") {
    return;
  }

  const payload: MockAuthState = {
    isAuthed: true,
    user
  };
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(payload));
  window.dispatchEvent(new StorageEvent("storage", { key: AUTH_STORAGE_KEY, newValue: JSON.stringify(payload) }));
};

export const clearStoredAuth = () => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(AUTH_STORAGE_KEY);
  window.dispatchEvent(new StorageEvent("storage", { key: AUTH_STORAGE_KEY, newValue: null }));
};
