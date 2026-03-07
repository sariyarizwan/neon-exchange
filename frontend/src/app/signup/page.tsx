"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { readStoredAuth, writeStoredAuth } from "@/lib/mockAuth";
import styles from "@/components/auth/AuthShell.module.css";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [avatarId, setAvatarId] = useState("runner");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (readStoredAuth()?.isAuthed) {
      router.replace("/");
    }
  }, [router]);

  const createAccount = (guest = false) => {
    writeStoredAuth({
      displayName: guest ? "Guest Runner" : displayName || "Night Trader",
      avatarId,
      email: guest ? "guest@neon.exchange" : email || "guest@neon.exchange",
      guest
    });
    router.replace("/");
    router.refresh();
    window.setTimeout(() => {
      if (window.location.pathname !== "/") {
        window.location.assign("/");
      }
    }, 120);
  };

  const mismatch = confirmPassword.length > 0 && password !== confirmPassword;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!displayName.trim()) {
      setError("Enter a display name to create the mock account.");
      return;
    }
    if (!email.trim()) {
      setError("Enter an email address. Any value works in mock mode.");
      return;
    }
    if (!password.trim()) {
      setError("Enter a password to continue.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Password and confirm password must match.");
      return;
    }
    setError(null);
    createAccount(false);
  };

  return (
    <AuthShell
      accent="magenta"
      eyebrow="Create Account"
      title="Join The Exchange"
      description="Build a mock profile, choose an avatar, and enter a living stock-market city shaped like a neon district crawler."
      panelEyebrow="Identity"
      panelTitle="Create Your Operator Profile"
      panelText="This is still mock auth, but the entry flow now behaves like a real premium product shell."
      error={error}
      submitLabel="Create Account"
      secondaryLabel="Continue as Guest"
      secondaryHint="Future Gemini Live and agent features can attach to this user shell later without changing the frontend flow."
      onSubmit={handleSubmit}
      onSecondary={() => createAccount(true)}
      submitDisabled={mismatch}
      avatarId={avatarId}
      onAvatarSelect={setAvatarId}
      footer={
        <>
          Already have access?{" "}
          <Link href="/login">
            Sign In
          </Link>
        </>
      }
    >
      <label className={styles.label}>
        <span className={styles.labelText}>Display Name</span>
        <input className={styles.input} value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
      </label>
      <label className={styles.label}>
        <span className={styles.labelText}>Email</span>
        <input className={styles.input} type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
      </label>
      <label className={styles.label}>
        <span className={styles.labelText}>Password</span>
        <input className={styles.input} type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
      </label>
      <label className={styles.label}>
        <span className={styles.labelText}>Confirm Password</span>
        <input className={styles.input} type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
      </label>
    </AuthShell>
  );
}
