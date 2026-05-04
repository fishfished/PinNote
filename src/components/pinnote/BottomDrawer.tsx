"use client";

import { motion } from "framer-motion";

interface Props {
  textInput: string;
  onTextChange: (v: string) => void;
  onPin: () => void;
  onImageUpload: () => void;
  onScreenshot: () => void;
}

export function BottomDrawer({ textInput, onTextChange, onPin, onImageUpload, onScreenshot }: Props) {
  return (
    <aside
      className="absolute bottom-0 left-0 w-full z-30 flex flex-col rounded-t-3xl"
      style={{
        background: "var(--app-surface-92)",
        backdropFilter: "blur(20px)",
        borderTop: "1px solid var(--app-border)",
        boxShadow: "0 -20px 50px color-mix(in srgb, black 60%, transparent)",
        padding: "20px 20px calc(32px + env(safe-area-inset-bottom))",
      }}
    >
      {/* Handle */}
      <div
        className="mx-auto mb-5 rounded-full"
        style={{
          width: 48,
          height: 4,
          background: "var(--app-text-secondary)",
          opacity: 0.3,
        }}
      />

      {/* Header */}
      <header className="flex items-center justify-between mb-5 px-1">
        <div className="flex items-center gap-2">
          <div style={{ color: "var(--app-primary)" }}>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 17v5" />
              <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z" />
            </svg>
          </div>
          <h1
            className="font-bold tracking-wide mt-0.5"
            style={{ fontSize: 16, color: "var(--app-text)" }}
          >
            PinNote
          </h1>
        </div>
        <div
          className="uppercase font-semibold"
          style={{
            fontSize: 10,
            padding: "4px 10px",
            background: "var(--app-surface)",
            borderRadius: 9999,
            color: "var(--app-text-secondary)",
            border: "1px solid var(--app-border)",
            letterSpacing: "0.1em",
          }}
        >
          Ready
        </div>
      </header>

      {/* Input Pad */}
      <div
        className="relative w-full flex flex-col"
        style={{
          height: 130,
          background: "var(--app-surface-95)",
          border: "1px solid var(--app-border)",
          borderRadius: 16,
          boxShadow: "inset 0 2px 8px color-mix(in srgb, black 40%, transparent)",
        }}
      >
        <textarea
          value={textInput}
          onChange={(e) => onTextChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              onPin();
            }
          }}
          placeholder="输入文字，或粘贴截图 (Ctrl+V)..."
          className="w-full flex-1 bg-transparent resize-none focus:outline-none break-words"
          style={{
            color: "var(--app-text)",
            fontSize: 14,
            padding: "12px",
            caretColor: "var(--app-primary)",
          }}
        />
        {/* Actions */}
        <nav className="px-3 pb-2 flex justify-between items-center">
          <button
            onClick={onImageUpload}
            aria-label="上传图片"
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: "var(--app-text-secondary)" }}
            onMouseEnter={(e) => (((e.currentTarget as HTMLElement).style.color = "var(--app-text)") as unknown as void)}
            onMouseLeave={(e) => (((e.currentTarget as HTMLElement).style.color = "var(--app-text-secondary)") as unknown as void)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="9" cy="9" r="2"/>
              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
            </svg>
          </button>
          <button
            onClick={onScreenshot}
            aria-label="截图"
            title="截图 (Ctrl+Shift+S)"
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: "var(--app-text-secondary)" }}
            onMouseEnter={(e) => (((e.currentTarget as HTMLElement).style.color = "var(--app-text)") as unknown as void)}
            onMouseLeave={(e) => (((e.currentTarget as HTMLElement).style.color = "var(--app-text-secondary)") as unknown as void)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
          </button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onPin}
            disabled={!textInput.trim()}
            aria-label="钉在屏幕上"
            className="flex items-center gap-1.5 font-semibold transition-opacity disabled:opacity-40"
            style={{
              fontSize: 13,
              padding: "6px 16px",
              borderRadius: 8,
              background: "var(--app-primary)",
              color: "var(--app-surface)",
              boxShadow: "0 4px 12px color-mix(in srgb, var(--app-primary) 25%, transparent)",
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14" />
              <path d="M12 5v14" />
            </svg>
            钉在屏幕上
          </motion.button>
        </nav>
      </div>
    </aside>
  );
}
