import { useRef, useCallback } from "react";
import type { DrawTool } from "@/types/cards";

interface Options {
  isDrawing: boolean;
  activeTool: DrawTool;
  activeColor: string;
  strokeSize: number;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  onTextClick?: (x: number, y: number) => void;
  /** Called after each completed stroke/shape with the current canvas ImageData */
  onStrokeDone?: (snapshot: ImageData) => void;
}

export function getCanvasPoint(e: React.PointerEvent, canvas: HTMLCanvasElement) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (e.clientX - rect.left) * (canvas.width / rect.width),
    y: (e.clientY - rect.top) * (canvas.height / rect.height),
  };
}

function applyStyle(ctx: CanvasRenderingContext2D, tool: DrawTool, color: string, size: number) {
  ctx.globalCompositeOperation = tool === "eraser" ? "destination-out" : "source-over";
  ctx.strokeStyle = tool === "eraser" ? "rgba(0,0,0,1)" : color;
  ctx.fillStyle = color;
  ctx.lineWidth = tool === "eraser" ? size : tool === "pen" ? size : 2;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
}

const SHAPE_TOOLS = new Set<DrawTool>(["rect", "rect-solid", "ellipse", "ellipse-solid"]);

export function useDrawCanvas({
  isDrawing, activeTool, activeColor, strokeSize,
  canvasRef, onTextClick, onStrokeDone,
}: Options) {
  const isDrawingPath = useRef(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);
  const shapeAnchor = useRef<{ x: number; y: number } | null>(null);
  // Snapshot taken at pointer-down, used as live-preview base for shapes
  // and as the "before" state pushed to the undo stack on pointer-up
  const preStrokeSnapshot = useRef<ImageData | null>(null);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (!isDrawing) return;
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    const c = canvasRef.current;
    if (!c) return;
    const pt = getCanvasPoint(e, c);

    if (activeTool === "text") { onTextClick?.(pt.x, pt.y); return; }

    // Save current state BEFORE the stroke begins — this is what we restore on undo
    const ctx = c.getContext("2d")!;
    preStrokeSnapshot.current = ctx.getImageData(0, 0, c.width, c.height);

    if (SHAPE_TOOLS.has(activeTool)) {
      shapeAnchor.current = pt;
    } else {
      isDrawingPath.current = true;
      lastPoint.current = pt;
    }
  }, [isDrawing, activeTool, canvasRef, onTextClick]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDrawing) return;
    const c = canvasRef.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    const pt = getCanvasPoint(e, c);

    if (SHAPE_TOOLS.has(activeTool) && shapeAnchor.current && preStrokeSnapshot.current) {
      // Restore pre-stroke state so each preview is clean
      ctx.putImageData(preStrokeSnapshot.current, 0, 0);
      applyStyle(ctx, activeTool, activeColor, strokeSize);
      drawShape(ctx, activeTool, shapeAnchor.current, pt);
    } else if (!SHAPE_TOOLS.has(activeTool) && activeTool !== "text" && isDrawingPath.current && lastPoint.current) {
      applyStyle(ctx, activeTool, activeColor, strokeSize);
      ctx.beginPath();
      ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
      ctx.lineTo(pt.x, pt.y);
      ctx.stroke();
      lastPoint.current = pt;
    }
  }, [isDrawing, activeTool, activeColor, strokeSize, canvasRef]);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    const c = canvasRef.current;
    const ctx = c?.getContext("2d");

    if (SHAPE_TOOLS.has(activeTool) && shapeAnchor.current && preStrokeSnapshot.current && c && ctx) {
      const pt = getCanvasPoint(e, c);
      ctx.putImageData(preStrokeSnapshot.current, 0, 0);
      applyStyle(ctx, activeTool, activeColor, strokeSize);
      drawShape(ctx, activeTool, shapeAnchor.current, pt);
      shapeAnchor.current = null;
    }

    // Push the pre-stroke snapshot to the undo stack (via callback)
    if (preStrokeSnapshot.current) {
      onStrokeDone?.(preStrokeSnapshot.current);
      preStrokeSnapshot.current = null;
    }

    isDrawingPath.current = false;
    lastPoint.current = null;
    if (ctx) ctx.globalCompositeOperation = "source-over";
  }, [activeTool, activeColor, strokeSize, canvasRef, onStrokeDone]);

  return { onPointerDown, onPointerMove, onPointerUp };
}

function drawShape(ctx: CanvasRenderingContext2D, tool: DrawTool, anchor: { x: number; y: number }, end: { x: number; y: number }) {
  const x = Math.min(anchor.x, end.x), y = Math.min(anchor.y, end.y);
  const w = Math.abs(end.x - anchor.x), h = Math.abs(end.y - anchor.y);
  ctx.beginPath();
  if (tool === "rect") { ctx.rect(anchor.x, anchor.y, end.x - anchor.x, end.y - anchor.y); ctx.stroke(); }
  else if (tool === "rect-solid") { ctx.rect(anchor.x, anchor.y, end.x - anchor.x, end.y - anchor.y); ctx.fill(); }
  else if (tool === "ellipse") { if (!w || !h) return; ctx.ellipse(x + w/2, y + h/2, w/2, h/2, 0, 0, Math.PI*2); ctx.stroke(); }
  else if (tool === "ellipse-solid") { if (!w || !h) return; ctx.ellipse(x + w/2, y + h/2, w/2, h/2, 0, 0, Math.PI*2); ctx.fill(); }
}
