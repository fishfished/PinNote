"use client";

import { useRef, useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";

interface Props {
  videoEl: HTMLVideoElement;
  onCrop: (x: number, y: number, w: number, h: number) => void;
  onCancel: () => void;
}

export function ScreenshotOverlay({ videoEl, onCrop, onCancel }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selection, setSelection] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const rafRef = useRef<number | null>(null);

  // Draw video frame continuously as background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const draw = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
      // Dark overlay
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      // Clear selection area
      if (selection) {
        ctx.clearRect(selection.x, selection.y, selection.w, selection.h);
        ctx.strokeStyle = "#D36E52";
        ctx.lineWidth = 2;
        ctx.strokeRect(selection.x, selection.y, selection.w, selection.h);
        // Corner handles
        const handles = [
          [selection.x, selection.y], [selection.x + selection.w, selection.y],
          [selection.x, selection.y + selection.h], [selection.x + selection.w, selection.y + selection.h],
        ];
        ctx.fillStyle = "#D36E52";
        handles.forEach(([hx, hy]) => {
          ctx.beginPath();
          ctx.arc(hx, hy, 5, 0, Math.PI * 2);
          ctx.fill();
        });
        // Size label
        if (Math.abs(selection.w) > 40 && Math.abs(selection.h) > 20) {
          ctx.fillStyle = "#D36E52";
          ctx.font = "12px Inter, system-ui, sans-serif";
          ctx.fillText(
            `${Math.abs(Math.round(selection.w))} × ${Math.abs(Math.round(selection.h))}`,
            selection.x + (selection.w > 0 ? 4 : selection.w + 4),
            selection.y + (selection.h > 0 ? -6 : selection.h - 6)
          );
        }
      }
      rafRef.current = requestAnimationFrame(draw);
    };
    rafRef.current = requestAnimationFrame(draw);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [videoEl, selection]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStart.current = { x: e.clientX, y: e.clientY };
    setSelection({ x: e.clientX, y: e.clientY, w: 0, h: 0 });
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragStart.current) return;
    setSelection({
      x: dragStart.current.x,
      y: dragStart.current.y,
      w: e.clientX - dragStart.current.x,
      h: e.clientY - dragStart.current.y,
    });
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!dragStart.current || !selection) { dragStart.current = null; return; }
    const x = Math.min(dragStart.current.x, e.clientX);
    const y = Math.min(dragStart.current.y, e.clientY);
    const w = Math.abs(e.clientX - dragStart.current.x);
    const h = Math.abs(e.clientY - dragStart.current.y);
    dragStart.current = null;
    if (w < 8 || h < 8) { setSelection(null); return; }
    onCrop(x, y, w, h);
  }, [selection, onCrop]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-[9999]"
      style={{ cursor: "crosshair" }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <canvas ref={canvasRef} className="w-full h-full" />
      {/* Instructions */}
      <div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl text-sm font-medium"
        style={{ background: "rgba(20,18,16,0.9)", color: "var(--app-text-secondary)", border: "1px solid var(--app-border)", pointerEvents: "none" }}
      >
        拖拽框选截图区域 · <span style={{ color: "var(--app-text)" }}>Esc</span> 取消
      </div>
      {/* Esc to cancel */}
      <EscWatcher onEsc={onCancel} />
    </motion.div>
  );
}

function EscWatcher({ onEsc }: { onEsc: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onEsc(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onEsc]);
  return null;
}
