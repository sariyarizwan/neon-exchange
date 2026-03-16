import { describe, it, expect, beforeEach } from "vitest";
import { readStoredAuth, writeStoredAuth, clearStoredAuth, AUTH_STORAGE_KEY } from "@/lib/mockAuth";
import type { MockUser } from "@/types/auth";

const validUser: MockUser = {
  displayName: "Neon Trader",
  avatarId: "runner",
  email: "trader@neon.exchange",
};

const guestUser: MockUser = {
  displayName: "Ghost",
  avatarId: "ghost",
  email: "ghost@neon.exchange",
  guest: true,
};

beforeEach(() => {
  localStorage.clear();
});

describe("readStoredAuth", () => {
  it("returns null when localStorage has no auth key", () => {
    expect(readStoredAuth()).toBeNull();
  });

  it("returns null when localStorage contains invalid JSON", () => {
    localStorage.setItem(AUTH_STORAGE_KEY, "not-valid-json{{{");
    expect(readStoredAuth()).toBeNull();
  });

  it("returns null when stored auth has isAuthed=false", () => {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ isAuthed: false, user: validUser }));
    expect(readStoredAuth()).toBeNull();
  });

  it("returns null when stored user is missing displayName", () => {
    const bad = { isAuthed: true, user: { avatarId: "runner", email: "a@b.com" } };
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(bad));
    expect(readStoredAuth()).toBeNull();
  });

  it("returns null when stored user is missing avatarId", () => {
    const bad = { isAuthed: true, user: { displayName: "X", email: "a@b.com" } };
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(bad));
    expect(readStoredAuth()).toBeNull();
  });

  it("returns null when stored user is missing email", () => {
    const bad = { isAuthed: true, user: { displayName: "X", avatarId: "runner" } };
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(bad));
    expect(readStoredAuth()).toBeNull();
  });
});

describe("writeStoredAuth + readStoredAuth roundtrip", () => {
  it("persists user data that can be read back", () => {
    writeStoredAuth(validUser);
    const result = readStoredAuth();
    expect(result).not.toBeNull();
    expect(result!.isAuthed).toBe(true);
    expect(result!.user.displayName).toBe("Neon Trader");
    expect(result!.user.email).toBe("trader@neon.exchange");
    expect(result!.user.avatarId).toBe("runner");
  });

  it("preserves the guest flag when set", () => {
    writeStoredAuth(guestUser);
    const result = readStoredAuth();
    expect(result).not.toBeNull();
    expect(result!.user.guest).toBe(true);
  });
});

describe("clearStoredAuth", () => {
  it("removes stored auth so subsequent readStoredAuth returns null", () => {
    writeStoredAuth(validUser);
    clearStoredAuth();
    expect(readStoredAuth()).toBeNull();
  });

  it("is a no-op when no auth was stored", () => {
    expect(() => clearStoredAuth()).not.toThrow();
    expect(readStoredAuth()).toBeNull();
  });
});
