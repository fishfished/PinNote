"use client";

import { useRef, useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ImageCard, DrawTool } from "@/types/cards";
import { clamp } from "@/utils/cardUtils";
import { useDrawCanvas } from "@/hooks/useDrawCanvas";

interface CanvasTextObj {
  id: string;
  x: number; y: number; // percent of card dimensions
  text: string; color: string; fontSize: number;
}

interface Props {
  card: ImageCard;
  isDrawing: boolean;
  activeTool: DrawTool;
  activeColor: string;
  strokeSize: number;
  fontSize: number;
  ocrLoading: boolean;
  onRegisterCanvas: (el: HTMLCanvasElement | null) => void;
  onStrokeDone: (snapshot: ImageData) => void;
  onPointerDownCard: () => void;
  onHide: (id: string) => void;
  onContextMenu: (e: React.MouseEvent, id: string, type: "image") => void;
  onPositionChange: (id: string, pos: { x: number; y: number }) => void;
  onSizeChange: (id: string, size: { width: number; height: number }) => void;
  canvasRef: React.RefObject<HTMLDivElement | null>;
}

let _tid = 0;
const newTid = () => `t${++_tid}`;

const FONT_SIZES = [10, 12, 14, 16, 20, 24, 32, 48, 64];
const TEXT_COLORS = ["#D36E52", "#EFE9DF", "#928F8B", "#60a5fa", "#4ade80", "#facc15", "#f472b6", "#fff", "#000"];

export function FloatingImageCard({
  card, isDrawing, activeTool, activeColor, strokeSize, fontSize, ocrLoading,
  onRegisterCanvas, onStrokeDone, onPointerDownCard,
  onHide, onContextMenu, onPositionChange, onSizeChange, canvasRef,
}: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const drawCanvasRef = useRef<HTMLCanvasElement>(null);
  const dragStart = useRef<{ mx: number; my: number; cx: number; cy: number } | null>(null);
  const resizeStart = useRef<{ mx: number; my: number; w: number; h: number } | null>(null);

  // DOM text objects
  const [textObjs, setTextObjs] = useState<CanvasTextObj[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingText, setPendingText] = useState<{ x: number; y: number } | null>(null);
  const pendingRef = useRef<HTMLTextAreaElement>(null);

  // Register canvas with parent for undo
  useEffect(() => {
    const el = drawCanvasRef.current;
    onRegisterCanvas(el);
    return () => onRegisterCanvas(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTextClick = useCallback((cx: number, cy: number) => {
    const c = drawCanvasRef.current;
    if (!c) return;
    setPendingText({ x: cx / c.width, y: cy / c.height });
    setTimeout(() => pendingRef.current?.focus(), 50);
  }, []);

  const commitPending = useCallback((value: string) => {
    if (value.trim()) {
      setTextObjs((prev) => [...prev, { id: newTid(), x: pendingText!.x, y: pendingText!.y, text: value.trim(), color: activeColor, fontSize }]);
    }
    setPendingText(null);
  }, [pendingText, activeColor, fontSize]);

  const { onPointerDown: drawDown, onPointerMove: drawMove, onPointerUp: drawUp } =
    useDrawCanvas({ isDrawing, activeTool, activeColor, strokeSize, canvasRef: drawCanvasRef, onTextClick: handleTextClick, onStrokeDone });

  // Non-passive wheel resize
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      if (isDrawing) return;
      e.preventDefault();
      const delta = e.deltaY < 0 ? 1.1 : 0.9;
      const aspect = card.size.height / card.size.width;
      const newW = clamp(Math.round(card.size.width * delta), 80, 1200);
      onSizeChange(card.id, { width: newW, height: Math.round(newW * aspect) });
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, [card.id, card.size, isDrawing, onSizeChange]);

  // Preserve drawings on resize
  useEffect(() => {
    const c = drawCanvasRef.current;
    if (!c) return;
    if (c.width !== card.size.width || c.height !== card.size.height) {
      const tmp = document.createElement("canvas");
      tmp.width = c.width; tmp.height = c.height;
      tmp.getContext("2d")?.drawImage(c, 0, 0);
      c.width = card.size.width; c.height = card.size.height;
      c.getContext("2d")?.drawImage(tmp, 0, 0);
    }
  }, [card.size.width, card.size.height]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    onPointerDownCard();
    if (isDrawing) return;
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStart.current = { mx: e.clientX, my: e.clientY, cx: card.position.x, cy: card.position.y };
  }, [card.position, isDrawing]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (dragStart.current && !isDrawing) {
      const cv = canvasRef.current;
      onPositionChange(card.id, {
        x: clamp(dragStart.current.cx + e.clientX - dragStart.current.mx, 0, cv ? cv.clientWidth - card.size.width : 2000),
        y: clamp(dragStart.current.cy + e.clientY - dragStart.current.my, 0, cv ? cv.clientHeight - 40 : 2000),
      });
    }
    if (resizeStart.current) {
      onSizeChange(card.id, {
        width: clamp(resizeStart.current.w + e.clientX - resizeStart.current.mx, 120, 800),
        height: clamp(resizeStart.current.h + e.clientY - resizeStart.current.my, 80, 600),
      });
    }
  }, [card.id, card.size, canvasRef, isDrawing, onPositionChange, onSizeChange]);

  const handlePointerUp = useCallback(() => { dragStart.current = null; resizeStart.current = null; }, []);
  const handleResizeDown = useCallback((e: React.PointerEvent) => {
    e.stopPropagation(); e.currentTarget.setPointerCapture(e.pointerId);
    resizeStart.current = { mx: e.clientX, my: e.clientY, w: card.size.width, h: card.size.height };
  }, [card.size]);

  return (
    <motion.div ref={cardRef}
      initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: card.opacity, scale: 1 }} exit={{ opacity: 0, scale: 0.88 }}
      transition={{ duration: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
      style={{ position: "absolute", left: card.position.x, top: card.position.y, width: card.size.width, height: card.size.height, zIndex: 50, cursor: isDrawing ? (activeTool === "text" ? "text" : "crosshair") : "grab" }}
      onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp}
      onDoubleClick={() => !isDrawing && onHide(card.id)}
      onContextMenu={(e) => !isDrawing && onContextMenu(e, card.id, "image")}
    >
      <div className="relative w-full h-full overflow-hidden rounded-sm" style={{ filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.6))" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={card.src} alt={card.fileName ?? "pinned image"} className="w-full h-full object-cover pointer-events-none select-none" draggable={false} />
        <canvas ref={drawCanvasRef} width={card.size.width} height={card.size.height}
          className="absolute inset-0 w-full h-full"
          style={{ cursor: isDrawing ? (activeTool === "text" ? "text" : "crosshair") : "inherit", pointerEvents: isDrawing ? "all" : "none" }}
          onPointerDown={drawDown} onPointerMove={drawMove} onPointerUp={drawUp}
        />

        {/* DOM text objects */}
        {textObjs.map((obj) => (
          <TextObject key={obj.id} obj={obj} isEditing={editingId === obj.id} isDrawingMode={isDrawing}
            onStartEdit={() => { if (!isDrawing) setEditingId(obj.id); }}
            onEndEdit={() => setEditingId(null)}
            onChange={(text) => setTextObjs((p) => p.map((o) => o.id === obj.id ? { ...o, text } : o))}
            onColorChange={(color) => setTextObjs((p) => p.map((o) => o.id === obj.id ? { ...o, color } : o))}
            onFontSizeChange={(fs) => setTextObjs((p) => p.map((o) => o.id === obj.id ? { ...o, fontSize: fs } : o))}
            onDelete={() => setTextObjs((p) => p.filter((o) => o.id !== obj.id))}
            onMove={(dx, dy) => setTextObjs((p) => p.map((o) => o.id === obj.id ? { ...o, x: clamp(o.x + dx / card.size.width, 0, 0.95), y: clamp(o.y + dy / card.size.height, 0, 0.95) } : o))}
          />
        ))}

        {/* Pending text input */}
        <AnimatePresence>
          {pendingText && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="absolute z-20" style={{ left: pendingText.x * 100 + "%", top: pendingText.y * 100 + "%" }}>
              <textarea ref={pendingRef} placeholder="输入文字..." className="resize-none focus:outline-none" rows={1}
                style={{ background: "rgba(20,18,16,0.85)", color: activeColor, fontSize, fontWeight: 500, padding: "4px 8px", borderRadius: 4, border: "1px solid " + activeColor, minWidth: 100, minHeight: 32, caretColor: activeColor }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); commitPending((e.target as HTMLTextAreaElement).value); }
                  if (e.key === "Escape") setPendingText(null);
                }}
                onBlur={(e) => commitPending(e.target.value)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {ocrLoading && <div className="absolute inset-0 shimmer pointer-events-none" />}
      </div>
      <div className="resize-handle" onPointerDown={handleResizeDown}
        style={{ cursor: "nwse-resize", opacity: 0, transition: "opacity 0.2s ease" }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = "0")}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M10 2L2 10M10 6L6 10" stroke="rgba(239,233,223,0.5)" strokeWidth="1.5" strokeLinecap="round"/></svg>
      </div>
    </motion.div>
  );
}

function TextObject({ obj, isEditing, isDrawingMode, onStartEdit, onEndEdit, onChange, onColorChange, onFontSizeChange, onDelete, onMove }: {
  obj: CanvasTextObj; isEditing: boolean; isDrawingMode: boolean;
  onStartEdit: () => void; onEndEdit: () => void;
  onChange: (t: string) => void; onColorChange: (c: string) => void;
  onFontSizeChange: (s: number) => void; onDelete: () => void;
  onMove: (dx: number, dy: number) => void;
}) {
  const dragRef = useRef<{ mx: number; my: number } | null>(null);
  const [hover, setHover] = useState(false);

  return (
    <div style={{ position: "absolute", left: obj.x * 100 + "%", top: obj.y * 100 + "%", zIndex: isEditing ? 30 : 20, pointerEvents: isDrawingMode ? "none" : "all" }}
      onMouseEnter={() => !isDrawingMode && setHover(true)}
      onMouseLeave={() => !isEditing && setHover(false)}
    >
      {isEditing ? (
        <textarea autoFocus value={obj.text}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => { onEndEdit(); setHover(false); }}
          onKeyDown={(e) => { if (e.key === "Escape") { onEndEdit(); setHover(false); } }}
          onPointerDown={(e) => e.stopPropagation()}
          className="resize-none focus:outline-none"
          style={{ background: "rgba(20,18,16,0.85)", color: obj.color, fontSize: obj.fontSize, fontWeight: 500, padding: "2px 6px", borderRadius: 4, border: "1px solid " + obj.color, minWidth: 60, minHeight: 24, caretColor: obj.color }}
        />
      ) : (
        <div onDoubleClick={() => !isDrawingMode && onStartEdit()}
          onPointerDown={(e) => { if (isDrawingMode) return; e.stopPropagation(); (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); dragRef.current = { mx: e.clientX, my: e.clientY }; }}
          onPointerMove={(e) => { if (!dragRef.current) return; onMove(e.clientX - dragRef.current.mx, e.clientY - dragRef.current.my); dragRef.current = { mx: e.clientX, my: e.clientY }; }}
          onPointerUp={() => { dragRef.current = null; }}
          style={{ color: obj.color, fontSize: obj.fontSize, fontWeight: 500, whiteSpace: "pre-wrap", wordBreak: "break-word", padding: "2px 6px", borderRadius: 4, cursor: "move", userSelect: "none", textShadow: "0 1px 4px rgba(0,0,0,0.7)", outline: hover ? "1px dashed " + obj.color : "none" }}
        >{obj.text}</div>
      )}

      <AnimatePresence>
        {(hover || isEditing) && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.12 }}
            onPointerDown={(e) => e.stopPropagation()}
            style={{ position: "absolute", top: "-38px", left: 0, display: "flex", alignItems: "center", gap: 4, background: "rgba(20,18,16,0.95)", border: "1px solid var(--app-border)", borderRadius: 8, padding: "4px 6px", boxShadow: "0 4px 16px rgba(0,0,0,0.6)", zIndex: 40, whiteSpace: "nowrap" }}>
            <button title="编辑" onClick={onStartEdit} style={{ padding: "2px 4px", borderRadius: 4, color: "var(--app-text-secondary)" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--app-text)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--app-text-secondary)")}
            ><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
            <select value={obj.fontSize} onChange={(e) => onFontSizeChange(Number(e.target.value))}
              style={{ background: "transparent", color: "var(--app-text-secondary)", border: "none", fontSize: 11, cursor: "pointer", outline: "none", padding: "0 2px" }}>
              {FONT_SIZES.map((s) => <option key={s} value={s} style={{ background: "#1A1816" }}>{s}px</option>)}
            </select>
            {TEXT_COLORS.map((c) => (
              <button key={c} onClick={() => onColorChange(c)} style={{ width: 14, height: 14, borderRadius: "50%", background: c, border: obj.color === c ? "2px solid var(--app-text)" : "1px solid rgba(255,255,255,0.2)", flexShrink: 0 }} />
            ))}
            <button title="删除" onClick={onDelete} style={{ padding: "2px 4px", borderRadius: 4, color: "var(--app-danger)", marginLeft: 2 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/></svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
