"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ShortcutConfig } from "@/lib/shortcuts";
import {
  SHORTCUT_LABELS, DEFAULT_SHORTCUTS,
  eventToShortcut, displayShortcut, saveShortcuts,
} from "@/lib/shortcuts";

interface Props {
  shortcuts: ShortcutConfig;
  onSave: (cfg: ShortcutConfig) => void;
  onClose: () => void;
}

export function SettingsPanel({ shortcuts, onSave, onClose }: Props) {
  const [draft, setDraft] = useState<ShortcutConfig>({ ...shortcuts });
  const [recording, setRecording] = useState<keyof ShortcutConfig | null>(null);
  const [conflict, setConflict] = useState<string | null>(null);

  // Listen for keydown while recording
  useEffect(() => {
    if (!recording) return;
    function handler(e: KeyboardEvent) {
      e.preventDefault();
      e.stopPropagation();
      const combo = eventToShortcut(e);
      // Require at least one modifier to avoid single-key conflicts
      if (!combo.includes("+")) return;
      // Check for conflict
      const entries = Object.entries(draft) as [keyof ShortcutConfig, string][];
      const clash = entries.find(([k, v]) => k !== recording && v === combo);
      if (clash) {
        setConflict(`与「${SHORTCUT_LABELS[clash[0]]}」冲突`);
        return;
      }
      setConflict(null);
      setDraft((prev) => ({ ...prev, [recording as string]: combo }));
      setRecording(null);
    }
    window.addEventListener("keydown", handler, true);
    return () => window.removeEventListener("keydown", handler, true);
  }, [recording, draft]);

  const handleSave = useCallback(() => {
    saveShortcuts(draft);
    onSave(draft);
    onClose();
  }, [draft, onSave, onClose]);

  const handleReset = useCallback(() => {
    setDraft({ ...DEFAULT_SHORTCUTS });
    setConflict(null);
    setRecording(null);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 12 }}
        transition={{ duration: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 420,
          maxWidth: "calc(100vw - 32px)",
          background: "#1E1C1A",
          border: "1px solid var(--app-border)",
          borderRadius: 16,
          boxShadow: "0 24px 60px rgba(0,0,0,0.8)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div style={{ padding: "16px 20px 12px", borderBottom: "1px solid var(--app-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--app-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/><path d="M12 2v3m0 14v3M4.22 4.22l2.12 2.12m11.32 11.32 2.12 2.12M2 12h3m14 0h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/>
            </svg>
            <span style={{ color: "var(--app-text)", fontWeight: 600, fontSize: 15 }}>设置</span>
          </div>
          <button onClick={onClose} style={{ color: "var(--app-text-secondary)", padding: 4, borderRadius: 6 }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--app-text)")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--app-text-secondary)")}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
            </svg>
          </button>
        </div>

        {/* Shortcut list */}
        <div style={{ padding: "8px 0", maxHeight: "60vh", overflowY: "auto" }}>
          <div style={{ padding: "6px 20px 4px", fontSize: 11, fontWeight: 600, color: "var(--app-text-secondary)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            快捷键
          </div>
          {(Object.keys(SHORTCUT_LABELS) as (keyof ShortcutConfig)[]).map((key) => {
            const isRecording = recording === key;
            return (
              <div key={key}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 20px", gap: 12 }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(239,233,223,0.03)")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
              >
                <span style={{ color: "var(--app-text)", fontSize: 13, flex: 1 }}>{SHORTCUT_LABELS[key]}</span>
                <button
                  onClick={() => { setRecording(isRecording ? null : key); setConflict(null); }}
                  style={{
                    padding: "4px 10px",
                    borderRadius: 6,
                    fontSize: 12,
                    fontFamily: "monospace",
                    fontWeight: 600,
                    minWidth: 120,
                    textAlign: "center",
                    background: isRecording
                      ? "color-mix(in srgb, var(--app-primary) 15%, transparent)"
                      : "var(--app-accent)",
                    color: isRecording ? "var(--app-primary)" : "var(--app-text-secondary)",
                    border: isRecording
                      ? "1px solid color-mix(in srgb, var(--app-primary) 30%, transparent)"
                      : "1px solid var(--app-border)",
                    transition: "all 0.15s ease",
                  }}
                >
                  {isRecording ? "按下快捷键…" : displayShortcut(draft[key])}
                </button>
              </div>
            );
          })}

          {/* Conflict warning */}
          <AnimatePresence>
            {conflict && (
              <motion.div
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                style={{ padding: "4px 20px", color: "var(--app-danger)", fontSize: 12 }}
              >
                {conflict}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div style={{ padding: "12px 20px", borderTop: "1px solid var(--app-border)", display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={handleReset}
            style={{ padding: "6px 14px", borderRadius: 8, fontSize: 13, color: "var(--app-text-secondary)", background: "transparent", border: "1px solid var(--app-border)" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--app-text)")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--app-text-secondary)")}
          >
            恢复默认
          </button>
          <button onClick={handleSave}
            style={{ padding: "6px 20px", borderRadius: 8, fontSize: 13, fontWeight: 600, background: "var(--app-primary)", color: "#fff" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = "0.85")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = "1")}
          >
            保存
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
