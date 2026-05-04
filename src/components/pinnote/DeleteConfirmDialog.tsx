"use client";

import { motion } from "framer-motion";

interface Props {
  isBulk: boolean;
  selectedCount?: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteConfirmDialog({ isBulk, selectedCount = 0, onConfirm, onCancel }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="absolute inset-0 z-[100] flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={onCancel}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.88, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.88, y: 16 }}
        transition={{ duration: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
        className="flex flex-col gap-4 rounded-2xl p-6 max-w-xs w-full mx-4"
        style={{
          background: "#1E1C1A",
          border: "1px solid var(--app-border)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.8)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col gap-1">
          <h3 style={{ color: "var(--app-text)", fontWeight: 600, fontSize: 16 }}>
            {isBulk ? `删除 ${selectedCount} 张卡片` : "删除卡片"}
          </h3>
          <p style={{ color: "var(--app-text-secondary)", fontSize: 13, lineHeight: 1.6 }}>
            {isBulk
              ? `将删除已选中的 ${selectedCount} 张卡片，此操作无法撤销。`
              : "删除后无法恢复，确定继续吗？"}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-lg font-medium transition-colors text-sm"
            style={{
              background: "var(--app-secondary)",
              color: "var(--app-text-secondary)",
              border: "1px solid var(--app-border)",
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--app-text)")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--app-text-secondary)")}
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-lg font-semibold transition-opacity text-sm"
            style={{
              background: "#ef4444",
              color: "#fff",
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = "0.85")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = "1")}
          >
            确认删除
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
