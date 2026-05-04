"use client";

import { useRef, useCallback, useState } from "react";
import { motion } from "framer-motion";
import type { DrawTool } from "@/types/cards";
import { clamp } from "@/utils/cardUtils";

interface Props {
  x: number;
  y: number;
  activeTool: DrawTool;
  activeColor: string;
  strokeSize: number;
  fontSize: number;
  canUndo: boolean;
  cardType: "text" | "image";  // controls which tools to show
  onToolChange: (t: DrawTool) => void;
  onColorChange: (c: string) => void;
  onStrokeSizeChange: (s: number) => void;
  onFontSizeChange: (s: number) => void;
  onUndo: () => void;
  onClose: () => void;
}

const COLORS = ["#D36E52", "#EFE9DF", "#928F8B", "#60a5fa", "#4ade80", "#facc15"];
const SIZE_RANGE = { min: 1, max: 60 };
const FONT_RANGE = { min: 10, max: 72 };

const TOOLS: { id: DrawTool; label: string; icon: React.ReactNode }[] = [
  { id: "pen", label: "画笔", icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg> },
  { id: "text", label: "添加文字", icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg> },
  { id: "rect", label: "空心矩形", icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/></svg> },
  { id: "rect-solid", label: "实心矩形", icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="18" height="18" rx="2"/></svg> },
  { id: "ellipse", label: "空心椭圆", icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><ellipse cx="12" cy="12" rx="10" ry="6"/></svg> },
  { id: "ellipse-solid", label: "实心椭圆", icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><ellipse cx="12" cy="12" rx="10" ry="6"/></svg> },
  { id: "eraser", label: "橡皮擦", icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"/><path d="M22 21H7"/><path d="m5 11 9 9"/></svg> },
];

export function DrawToolbar({
  x: initX, y: initY,
  activeTool, activeColor, strokeSize, fontSize, canUndo, cardType,
  onToolChange, onColorChange, onStrokeSizeChange, onFontSizeChange, onUndo, onClose,
}: Props) {
  const [pos, setPos] = useState(() => ({
    x: clamp(initX, 8, window.innerWidth - 56),
    y: clamp(initY, 8, window.innerHeight - 600),
  }));
  const dragStart = useRef<{ mx: number; my: number; bx: number; by: number } | null>(null);

  const showSizeSlider = activeTool === "pen" || activeTool === "eraser";
  const showFontSlider = activeTool === "text";
  // Filter tools: text card hides the "text stamp" tool (it would be redundant)
  const visibleTools = TOOLS.filter((t) => !(cardType === "text" && t.id === "text"));

  const handleDragDown = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStart.current = { mx: e.clientX, my: e.clientY, bx: pos.x, by: pos.y };
  }, [pos]);

  const handleDragMove = useCallback((e: React.PointerEvent) => {
    if (!dragStart.current) return;
    setPos({
      x: clamp(dragStart.current.bx + (e.clientX - dragStart.current.mx), 8, window.innerWidth - 56),
      y: clamp(dragStart.current.by + (e.clientY - dragStart.current.my), 8, window.innerHeight - 600),
    });
  }, []);

  const handleDragUp = useCallback(() => { dragStart.current = null; }, []);

  return (
    <motion.aside
      initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.88 }}
      transition={{ duration: 0.15, ease: [0.34, 1.56, 0.64, 1] }}
      className="draw-toolbar"
      style={{ left: pos.x, top: pos.y }}
      onClick={(e) => e.stopPropagation()}
      onPointerMove={handleDragMove}
      onPointerUp={handleDragUp}
    >
      {/* Drag grip */}
      <div onPointerDown={handleDragDown} title="拖动工具栏"
        style={{ width: 28, height: 18, margin: "0 auto 2px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 3, cursor: "grab", padding: "2px 4px" }}>
        {[0,1,2].map(i => <div key={i} style={{ height: 2, borderRadius: 2, background: "var(--app-text-secondary)", opacity: 0.4 }} />)}
      </div>

      {/* Undo */}
      <button
        onClick={onUndo} disabled={!canUndo} title="撤销 (Ctrl+Z)"
        style={{
          width: 36, height: 36, borderRadius: 9999, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto",
          color: canUndo ? "var(--app-text-secondary)" : "var(--app-text-muted)",
          cursor: canUndo ? "pointer" : "default",
          transition: "color 0.15s ease",
        }}
        onMouseEnter={(e) => { if (canUndo) (e.currentTarget as HTMLElement).style.color = "var(--app-text)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = canUndo ? "var(--app-text-secondary)" : "var(--app-text-muted)"; }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/>
        </svg>
      </button>

      <div style={{ width: 24, height: 1, background: "var(--app-border)", margin: "2px auto" }} />

      {/* Tools */}
      {visibleTools.map((t) => (
        <button key={t.id} onClick={() => onToolChange(t.id)} aria-label={t.label} title={t.label}
          style={{
            width: 36, height: 36, borderRadius: 9999, display: "flex", alignItems: "center", justifyContent: "center",
            color: activeTool === t.id ? "var(--app-primary)" : "var(--app-text-secondary)",
            background: activeTool === t.id ? "color-mix(in srgb, var(--app-primary) 12%, transparent)" : "transparent",
            border: activeTool === t.id ? "1px solid color-mix(in srgb, var(--app-primary) 25%, transparent)" : "1px solid transparent",
            transition: "all 0.15s ease",
          }}>{t.icon}</button>
      ))}

      {/* Stroke size slider */}
      {showSizeSlider && (
        <>
          <div style={{ width: 24, height: 1, background: "var(--app-border)", margin: "4px auto 2px" }} />
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 28 }}>
            <div style={{ borderRadius: "50%", background: activeTool === "eraser" ? "var(--app-text-secondary)" : activeColor, width: Math.max(3, Math.min(strokeSize, 24)), height: Math.max(3, Math.min(strokeSize, 24)), transition: "all 0.1s ease" }} />
          </div>
          <div style={{ width: 36, display: "flex", justifyContent: "center", padding: "2px 0 6px" }}>
            <input type="range" min={SIZE_RANGE.min} max={SIZE_RANGE.max} value={strokeSize}
              onChange={(e) => onStrokeSizeChange(Number(e.target.value))}
              style={{ writingMode: "vertical-lr" as const, direction: "rtl" as const, width: 20, height: 80, cursor: "pointer", accentColor: "var(--app-primary)" }} />
          </div>
        </>
      )}

      {/* Font size slider — shown when text tool active */}
      {showFontSlider && (
        <>
          <div style={{ width: 24, height: 1, background: "var(--app-border)", margin: "4px auto 2px" }} />
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 28 }}>
            <span style={{ color: activeColor, fontSize: Math.max(10, Math.min(fontSize / 2.5, 20)), fontWeight: 700, lineHeight: 1, transition: "font-size 0.1s ease" }}>A</span>
          </div>
          <div style={{ width: 36, display: "flex", justifyContent: "center", padding: "2px 0 6px" }}>
            <input type="range" min={FONT_RANGE.min} max={FONT_RANGE.max} value={fontSize}
              onChange={(e) => onFontSizeChange(Number(e.target.value))}
              style={{ writingMode: "vertical-lr" as const, direction: "rtl" as const, width: 20, height: 80, cursor: "pointer", accentColor: "var(--app-primary)" }} />
          </div>
        </>
      )}

      <div style={{ width: 24, height: 1, background: "var(--app-border)", margin: "2px auto" }} />

      {/* Color swatches */}
      {COLORS.map((color) => (
        <button key={color} title={color} onClick={() => onColorChange(color)}
          style={{ width: 26, height: 26, borderRadius: 9999, background: color, margin: "0 auto", display: "block", border: activeColor === color ? "2.5px solid var(--app-text)" : "2px solid transparent", transition: "border-color 0.15s ease" }} />
      ))}

      <div style={{ width: 24, height: 1, background: "var(--app-border)", margin: "2px auto" }} />

      {/* Close */}
      <button onClick={onClose}
        style={{ width: 36, height: 36, borderRadius: 9999, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--app-text-secondary)", margin: "0 auto" }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--app-text)")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--app-text-secondary)")}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
      </button>
    </motion.aside>
  );
}
