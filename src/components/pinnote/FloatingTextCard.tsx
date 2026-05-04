"use client";

import { useRef, useCallback, useState, useEffect } from "react";
import { motion } from "framer-motion";
import type { TextCard, DrawTool } from "@/types/cards";
import { clamp } from "@/utils/cardUtils";
import { useDrawCanvas } from "@/hooks/useDrawCanvas";

interface Props {
  card: TextCard;
  isDrawing: boolean;
  activeTool: DrawTool;
  activeColor: string;
  strokeSize: number;
  fontSize: number;
  onRegisterCanvas: (el: HTMLCanvasElement | null) => void;
  onStrokeDone: (snapshot: ImageData) => void;
  onPointerDownCard: () => void;
  onHide: (id: string) => void;
  onContextMenu: (e: React.MouseEvent, id: string, type: "text") => void;
  onPositionChange: (id: string, pos: { x: number; y: number }) => void;
  onSizeChange: (id: string, size: { width: number; height: number }) => void;
  onContentChange: (id: string, content: string) => void;
  canvasRef: React.RefObject<HTMLDivElement | null>;
}

const PAD = 12;

function autoResize(el: HTMLTextAreaElement) {
  el.style.height = "auto";
  el.style.height = el.scrollHeight + "px";
}

function measureTextWidth(text: string, font: string): number {
  if (typeof document === "undefined") return 200;
  const c = document.createElement("canvas");
  const ctx = c.getContext("2d");
  if (!ctx) return 200;
  ctx.font = font;
  return Math.max(...text.split("\n").map((l) => ctx.measureText(l).width));
}

export function FloatingTextCard({
  card, isDrawing, activeTool, activeColor, strokeSize, fontSize,
  onRegisterCanvas, onStrokeDone, onPointerDownCard,
  onHide, onContextMenu, onPositionChange, onSizeChange, onContentChange, canvasRef,
}: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const drawCanvasRef = useRef<HTMLCanvasElement>(null);
  const dragStart = useRef<{ mx: number; my: number; cx: number; cy: number } | null>(null);
  const [canvasSize, setCanvasSize] = useState({ w: card.size.width, h: card.size.height });

  // Register draw canvas with parent for undo
  useEffect(() => {
    const el = drawCanvasRef.current;
    onRegisterCanvas(el);
    return () => onRegisterCanvas(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { onPointerDown: drawDown, onPointerMove: drawMove, onPointerUp: drawUp } =
    useDrawCanvas({ isDrawing, activeTool, activeColor, strokeSize, canvasRef: drawCanvasRef, onStrokeDone });

  useEffect(() => {
    const c = drawCanvasRef.current;
    if (!c) return;
    const newW = card.size.width;
    const newH = cardRef.current?.offsetHeight ?? card.size.height;
    if (c.width !== newW || c.height !== newH) {
      const tmp = document.createElement("canvas");
      tmp.width = c.width; tmp.height = c.height;
      tmp.getContext("2d")?.drawImage(c, 0, 0);
      c.width = newW; c.height = newH;
      c.getContext("2d")?.drawImage(tmp, 0, 0);
      setCanvasSize({ w: newW, h: newH });
    }
  }, [card.size.width, card.size.height]);

  const syncWidth = useCallback((text: string) => {
    const measured = measureTextWidth(text, "500 14px Inter, system-ui, sans-serif");
    const newW = clamp(Math.ceil(measured) + PAD * 2 + 8, 120, 520);
    if (Math.abs(newW - card.size.width) > 4)
      onSizeChange(card.id, { width: newW, height: card.size.height });
  }, [card.id, card.size, onSizeChange]);

  const handlePointerDownDrag = useCallback((e: React.PointerEvent) => {
    onPointerDownCard(); // notify parent: this card was touched
    if (isEditing || (e.target as HTMLElement).tagName === "TEXTAREA") return;
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStart.current = { mx: e.clientX, my: e.clientY, cx: card.position.x, cy: card.position.y };
  }, [card.position, isEditing]);

  const handlePointerMoveDrag = useCallback((e: React.PointerEvent) => {
    if (!dragStart.current) return;
    const cv = canvasRef.current;
    onPositionChange(card.id, {
      x: clamp(dragStart.current.cx + e.clientX - dragStart.current.mx, 0, cv ? cv.clientWidth - card.size.width : 2000),
      y: clamp(dragStart.current.cy + e.clientY - dragStart.current.my, 0, cv ? cv.clientHeight - 40 : 2000),
    });
  }, [card.id, card.size.width, canvasRef, onPositionChange]);

  const handlePointerUpDrag = useCallback(() => { dragStart.current = null; }, []);

  return (
    <motion.div ref={cardRef}
      initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: card.opacity, scale: 1 }} exit={{ opacity: 0, scale: 0.88 }}
      transition={{ duration: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
      style={{
        position: "absolute", left: card.position.x, top: card.position.y, width: card.size.width, zIndex: 50,
        cursor: isDrawing ? "crosshair" : isEditing ? "default" : "grab",
        padding: PAD,
        background: "color-mix(in srgb, var(--app-accent) 85%, transparent)",
        border: "1px solid color-mix(in srgb, var(--app-text) 14%, transparent)",
        borderRadius: 10, backdropFilter: "blur(8px)", boxShadow: "0 6px 24px rgba(0,0,0,0.5)",
      }}
      onPointerDown={isDrawing ? undefined : handlePointerDownDrag}
      onPointerMove={isDrawing ? undefined : handlePointerMoveDrag}
      onPointerUp={isDrawing ? undefined : handlePointerUpDrag}
      onDoubleClick={(e) => { if (isDrawing || (e.target as HTMLElement).tagName === "TEXTAREA") return; onHide(card.id); }}
      onContextMenu={(e) => onContextMenu(e, card.id, "text")}
    >
      <textarea
        ref={(el) => {
          (textareaRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = el;
          if (el) { autoResize(el); syncWidth(el.value); }
        }}
        value={card.content}
        onChange={(e) => { onContentChange(card.id, e.target.value); autoResize(e.target); syncWidth(e.target.value); }}
        onFocus={() => setIsEditing(true)}
        onBlur={() => setIsEditing(false)}
        onPointerDown={(e) => e.stopPropagation()}
        className="bg-transparent resize-none focus:outline-none block overflow-hidden"
        style={{ width: "100%", color: "var(--app-text)", fontSize: 14, fontWeight: 500, lineHeight: 1.6, letterSpacing: "0.02em", height: "auto", caretColor: "var(--app-primary)", cursor: "text", whiteSpace: "pre", overflowWrap: "normal", pointerEvents: isDrawing ? "none" : "auto" }}
      />
      {/* Drawing canvas — always mounted so the parent can register/undo it; hidden when not in drawing mode */}
      <canvas ref={drawCanvasRef} width={canvasSize.w} height={canvasSize.h}
        style={{
          position: "absolute", inset: 0, width: "100%", height: "100%",
          cursor: "crosshair", borderRadius: 10,
          pointerEvents: isDrawing ? "all" : "none",
          opacity: isDrawing ? 1 : 0,      // hide visually but keep mounted
          display: "block",
        }}
        onPointerDown={drawDown} onPointerMove={drawMove} onPointerUp={drawUp}
      />
    </motion.div>
  );
}
