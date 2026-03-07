"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { readStoredAuth, writeStoredAuth } from "@/lib/mockAuth";
import styles from "@/components/auth/AuthShell.module.css";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [avatarId, setAvatarId] = useState("runner");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (readStoredAuth()?.isAuthed) {
      router.replace("/");
    }
  }, [router]);

  const completeAuth = (guest = false) => {
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

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!displayName.trim()) {
      setError("Enter a display name to continue.");
      return;
    }
    if (!email.trim()) {
      setError("Enter an email address. Mock auth accepts any value.");
      return;
    }
    if (!password.trim()) {
      setError("Enter any password value to create the local mock session.");
      return;
    }
    setError(null);
    completeAuth(false);
  };

  return (
    <AuthShell
      accent="cyan"
      eyebrow="NEON EXCHANGE"
      title="Enter The Exchange"
      description="A playable market city where sectors become districts, stocks become characters, and regime shifts become weather."
      panelEyebrow="Access"
      panelTitle="Login To The Night Market"
      panelText="Mock auth only. Enter any credentials, choose a pixel avatar, and drop directly into the city."
      error={error}
      submitLabel="Sign In"
      secondaryLabel="Continue as Guest"
      secondaryHint="This login uses localStorage only. No backend auth, no real accounts, and no API call is required."
      onSubmit={handleSubmit}
      onSecondary={() => completeAuth(true)}
      avatarId={avatarId}
      onAvatarSelect={setAvatarId}
      footer={
        <>
          Need an account shell instead?{" "}
          <Link href="/signup">
            Create Account
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
      <label className={`${styles.label} ${styles.fieldWide}`}>
        <span className={styles.labelText}>Password</span>
        <input className={styles.input} type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
      </label>
    </AuthShell>
  );
}
