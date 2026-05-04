"use client";

import { useRef, useEffect } from "react";
import { motion } from "framer-motion";

interface Props {
  onConfirm: (text: string) => void;
  onCancel: () => void;
}

export function QuickTextInput({ onConfirm, onCancel }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const val = ref.current?.value.trim() ?? "";
      if (val) onConfirm(val);
      else onCancel();
    }
    if (e.key === "Escape") {
      onCancel();
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[150] flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(3px)" }}
      onClick={onCancel}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 10 }}
        transition={{ duration: 0.18, ease: [0.34, 1.56, 0.64, 1] }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 380,
          maxWidth: "calc(100vw - 32px)",
          background: "rgba(30,28,26,0.97)",
          border: "1px solid var(--app-border)",
          borderRadius: 14,
          boxShadow: "0 20px 60px rgba(0,0,0,0.8)",
          overflow: "hidden",
          padding: 4,
        }}
      >
        <textarea
          ref={ref}
          onKeyDown={handleKey}
          placeholder="输入文字... Enter 确认，Esc 取消"
          className="w-full bg-transparent resize-none focus:outline-none"
          style={{
            color: "var(--app-text)",
            fontSize: 15,
            fontWeight: 500,
            lineHeight: 1.6,
            padding: "12px 14px",
            caretColor: "var(--app-primary)",
            minHeight: 80,
            display: "block",
          }}
          rows={3}
        />
        <div style={{ padding: "4px 12px 10px", color: "var(--app-text-muted)", fontSize: 11, display: "flex", justifyContent: "space-between" }}>
          <span>Shift+Enter 换行</span>
          <span>Enter 确认 · Esc 取消</span>
        </div>
      </motion.div>
    </motion.div>
  );
}
