"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import type { CardType } from "@/types/cards";

interface Props {
  x: number;
  y: number;
  cardType: CardType | null;
  onShowToolbar: () => void;
  onCopyImage?: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export function ContextMenu({ x, y, cardType, onShowToolbar, onCopyImage, onDelete, onClose }: Props) {
  // Adjust position so menu doesn't overflow viewport
  const adjustedX = Math.min(x, window.innerWidth - 200);
  const adjustedY = Math.min(y, window.innerHeight - 140);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <motion.nav
      initial={{ opacity: 0, scale: 0.92, y: -4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, y: -4 }}
      transition={{ duration: 0.15, ease: [0.34, 1.56, 0.64, 1] }}
      className="context-menu"
      style={{ left: adjustedX, top: adjustedY }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Show toolbar — available for all card types */}
      <>
        <button
          className="w-full text-left flex justify-between items-center transition-colors font-medium"
          style={{ padding: "12px 16px", fontSize: 14, color: "var(--app-text)" }}
          onClick={onShowToolbar}
          onMouseEnter={(e) => (((e.currentTarget as HTMLElement).style.background = "color-mix(in srgb, var(--app-text) 6%, transparent)") as unknown as void)}
          onMouseLeave={(e) => (((e.currentTarget as HTMLElement).style.background = "transparent") as unknown as void)}
        >
          显示工具栏
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--app-text-secondary)" }}>
            <path d="m14 18 4-4-4-4"/><path d="M6 14v4"/><path d="M6 6v4"/>
          </svg>
        </button>
        <div style={{ height: 1, background: "var(--app-border)" }} />
      </>

      {/* Copy image — image cards only */}
      {cardType === "image" && onCopyImage && (
        <>
          <button
            className="w-full text-left flex justify-between items-center transition-colors font-medium"
            style={{ padding: "12px 16px", fontSize: 14, color: "var(--app-text)" }}
            onClick={() => { onCopyImage(); onClose(); }}
            onMouseEnter={(e) => (((e.currentTarget as HTMLElement).style.background = "color-mix(in srgb, var(--app-text) 6%, transparent)") as unknown as void)}
            onMouseLeave={(e) => (((e.currentTarget as HTMLElement).style.background = "transparent") as unknown as void)}
          >
            复制图片
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--app-text-secondary)" }}>
              <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
              <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
            </svg>
          </button>
          <div style={{ height: 1, background: "var(--app-border)" }} />
        </>
      )}

      <button
        className="w-full text-left flex justify-between items-center transition-colors font-medium"
        style={{
          padding: "12px 16px",
          fontSize: 14,
          color: "var(--app-danger)",
        }}
        onClick={onDelete}
        onMouseEnter={(e) =>
          (((e.currentTarget as HTMLElement).style.background =
            "color-mix(in srgb, var(--app-danger) 10%, transparent)") as unknown as void)
        }
        onMouseLeave={(e) =>
          (((e.currentTarget as HTMLElement).style.background =
            "transparent") as unknown as void)
        }
      >
        删除
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ color: "color-mix(in srgb, var(--app-danger) 70%, transparent)" }}
        >
          <path d="M3 6h18" />
          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
          <line x1="10" x2="10" y1="11" y2="17" />
          <line x1="14" x2="14" y1="11" y2="17" />
        </svg>
      </button>
    </motion.nav>
  );
}
