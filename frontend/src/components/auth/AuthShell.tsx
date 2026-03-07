"use client";

import type { ReactNode } from "react";
import { avatarOptions } from "@/mock/cityWorld";
import styles from "./AuthShell.module.css";

type AuthShellProps = {
  accent: "cyan" | "magenta";
  eyebrow: string;
  title: string;
  description: string;
  panelEyebrow: string;
  panelTitle: string;
  panelText: string;
  error?: string | null;
  submitLabel: string;
  secondaryLabel: string;
  secondaryHint?: string;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onSecondary: () => void;
  submitDisabled?: boolean;
  avatarId: string;
  onAvatarSelect: (avatarId: string) => void;
  children: ReactNode;
  footer: ReactNode;
};

export function AuthShell({
  accent,
  eyebrow,
  title,
  description,
  panelEyebrow,
  panelTitle,
  panelText,
  error,
  submitLabel,
  secondaryLabel,
  secondaryHint,
  onSubmit,
  onSecondary,
  submitDisabled = false,
  avatarId,
  onAvatarSelect,
  children,
  footer
}: AuthShellProps) {
  return (
    <main className={styles.page}>
      <div className={styles.wrap}>
        <div className={styles.shell}>
          <div className={styles.grid}>
            <section className={styles.hero}>
              <div>
                <div className={styles.eyebrow} style={{ color: accent === "cyan" ? "#63f1ff" : "#ff85eb" }}>
                  {eyebrow}
                </div>
                <h1 className={styles.title}>{title}</h1>
                <p className={styles.lede}>{description}</p>
                <div className={styles.statusRow}>
                  <span className={styles.statusPill}>
                    <span className={styles.statusDot} />
                    Live city shell
                  </span>
                  <span className={styles.statusPill}>Mock auth active</span>
                  <span className={styles.statusPill}>Pixel market districts online</span>
                </div>
              </div>

              <div className={styles.cityCard}>
                <div className={styles.cityGlow} />
                <div className={styles.cityGrid}>
                  <div className={`${styles.district} ${styles.districtA}`} />
                  <div className={`${styles.district} ${styles.districtB}`} />
                  <div className={`${styles.district} ${styles.districtC}`} />
                  <div className={`${styles.district} ${styles.districtD}`} />
                  <div className={`${styles.road} ${styles.roadA}`} />
                  <div className={`${styles.road} ${styles.roadB}`} />
                  <div className={`${styles.node} ${styles.nodeOne}`} />
                  <div className={`${styles.node} ${styles.nodeTwo}`} />
                  <div className={`${styles.node} ${styles.nodeThree}`} />
                  <div className={`${styles.node} ${styles.nodeFour}`} />
                </div>
              </div>
            </section>

            <section className={styles.panel}>
              <div className={styles.panelInner}>
                <div className={styles.panelHeader}>
                  <div className={styles.panelEyebrow}>{panelEyebrow}</div>
                  <div className={styles.panelTitle}>{panelTitle}</div>
                  <div className={styles.panelText}>{panelText}</div>
                </div>

                {error ? <div className={styles.error}>{error}</div> : null}

                <form className={styles.form} onSubmit={onSubmit}>
                  <div className={styles.fieldGrid}>{children}</div>

                  <div className={styles.avatarSection}>
                    <div className={styles.labelText}>Avatar Selection</div>
                    <div className={styles.avatarGrid}>
                      {avatarOptions.map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          className={`${styles.avatarButton} ${avatarId === option.id ? styles.avatarButtonActive : ""}`}
                          onClick={() => onAvatarSelect(option.id)}
                        >
                          <span className={styles.avatarPreview}>
                            <span
                              style={{
                                position: "absolute",
                                left: 8,
                                top: 7,
                                width: 26,
                                height: 6,
                                borderRadius: 2,
                                backgroundColor: option.trim
                              }}
                            />
                            <span
                              style={{
                                position: "absolute",
                                left: 8,
                                top: 16,
                                width: 28,
                                height: 12,
                                borderRadius: 2,
                                backgroundColor: option.body
                              }}
                            />
                            <span
                              style={{
                                position: "absolute",
                                left: 12,
                                top: 22,
                                width: 18,
                                height: 4,
                                borderRadius: 2,
                                backgroundColor: option.visor
                              }}
                            />
                          </span>
                          <span className={styles.avatarName}>{option.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className={styles.actions}>
                    <button className={styles.buttonPrimary} type="submit" disabled={submitDisabled}>
                      {submitLabel}
                    </button>
                    <button className={styles.buttonSecondary} type="button" onClick={onSecondary}>
                      {secondaryLabel}
                    </button>
                  </div>
                </form>

                {secondaryHint ? <div className={styles.note}>{secondaryHint}</div> : null}
                <div className={styles.footer}>{footer}</div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
