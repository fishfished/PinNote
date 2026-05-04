"use client";

import { motion } from "framer-motion";

interface Props {
  onDismiss: () => void;
}

export function TooltipBanner({ onDismiss }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      className="absolute top-4 left-4 right-4 z-20 flex gap-3 items-start rounded-xl p-3.5 shadow-xl"
      style={{
        background: "rgba(20, 18, 16, 0.95)",
        border: "1px solid var(--app-border)",
        backdropFilter: "blur(12px)",
      }}
    >
      <div className="shrink-0 mt-0.5" style={{ color: "var(--app-primary)" }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
        </svg>
      </div>
      <div className="flex flex-col gap-1 flex-1" style={{ color: "var(--app-text-secondary)", fontSize: 12, fontWeight: 500, lineHeight: "1.6", letterSpacing: "0.03em" }}>
        <span>• 图片卡片：拖拽任意区域移动</span>
        <span>• 文字卡片：拖拽空白区域（非文字）移动</span>
        <span>• 双击任意卡片隐藏 · 右键查看选项</span>
      </div>
      <button
        onClick={onDismiss}
        className="shrink-0 p-0.5 rounded-md transition-colors"
        style={{ color: "var(--app-text-secondary)" }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
        </svg>
      </button>
    </motion.div>
  );
}
