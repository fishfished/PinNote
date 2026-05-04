"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import type {
  PinCard, TextCard, ImageCard,
  CardBoxState, ContextMenuState, DrawToolbarState, DeleteConfirmState, DrawTool,
} from "@/types/cards";
import { generateId, fileToBase64, fileToDataUrl, clamp, detectEdge } from "@/utils/cardUtils";
import { loadShortcuts, matchesShortcut, type ShortcutConfig } from "@/lib/shortcuts";
import { CardBoxPanel } from "@/components/pinnote/CardBoxPanel";
import { FloatingTextCard } from "@/components/pinnote/FloatingTextCard";
import { FloatingImageCard } from "@/components/pinnote/FloatingImageCard";
import { ContextMenu } from "@/components/pinnote/ContextMenu";
import { DrawToolbar } from "@/components/pinnote/DrawToolbar";
import { DeleteConfirmDialog } from "@/components/pinnote/DeleteConfirmDialog";
import { TooltipBanner } from "@/components/pinnote/TooltipBanner";
import { ScreenshotOverlay } from "@/components/pinnote/ScreenshotOverlay";
import { QuickTextInput } from "@/components/pinnote/QuickTextInput";
import { SettingsPanel } from "@/components/pinnote/SettingsPanel";

const MAX_UNDO = 40;

export default function PinNotePage() {
  const [cards, setCards] = useState<PinCard[]>([]);
  const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set());
  const [boxState, setBoxState] = useState<CardBoxState>({ position: { x: 16, y: 80 }, width: 280, collapsed: false, edge: "none" });
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({ visible: false, x: 0, y: 0, cardId: null, cardType: null });
  const [drawToolbar, setDrawToolbar] = useState<DrawToolbarState>({ visible: false, cardId: null, x: 0, y: 0 });
  const [activeTool, setActiveTool] = useState<DrawTool>("pen");
  const [activeColor, setActiveColor] = useState("#D36E52");
  const [strokeSize, setStrokeSize] = useState(4);
  const [fontSize, setFontSize] = useState(16);
  const [drawingCardId, setDrawingCardId] = useState<string | null>(null);
  const [canUndo, setCanUndo] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmState>({ visible: false, cardId: null, isBulk: false });
  const [ocrLoading, setOcrLoading] = useState<string | null>(null);
  const [showTooltip, setShowTooltip] = useState(true);
  const [screenshotStream, setScreenshotStream] = useState<{ stream: MediaStream; videoEl: HTMLVideoElement } | null>(null);
  const [showQuickText, setShowQuickText] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [allHidden, setAllHidden] = useState(false);
  const [shortcuts, setShortcuts] = useState<ShortcutConfig>(() => loadShortcuts());

  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Undo infrastructure ─────────────────────────────────────────
  const undoStacks = useRef<Map<string, ImageData[]>>(new Map());
  const drawCanvasRefs = useRef<Map<string, HTMLCanvasElement>>(new Map());

  const registerCanvas = useCallback((cardId: string, el: HTMLCanvasElement | null) => {
    if (el) drawCanvasRefs.current.set(cardId, el);
    else drawCanvasRefs.current.delete(cardId);
  }, []);

  const pushUndoSnapshot = useCallback((cardId: string, snapshot: ImageData) => {
    if (!undoStacks.current.has(cardId)) undoStacks.current.set(cardId, []);
    const stack = undoStacks.current.get(cardId)!;
    stack.push(snapshot);
    if (stack.length > MAX_UNDO) stack.shift();
    setCanUndo(stack.length > 0);
  }, []);

  const handleUndo = useCallback(() => {
    if (!drawingCardId) return;
    const stack = undoStacks.current.get(drawingCardId);
    if (!stack || stack.length === 0) return;
    const prev = stack.pop()!;
    const canvas = drawCanvasRefs.current.get(drawingCardId);
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.putImageData(prev, 0, 0);
    }
    setCanUndo((stack.length ?? 0) > 0);
  }, [drawingCardId]);

  useEffect(() => {
    const len = drawingCardId ? (undoStacks.current.get(drawingCardId)?.length ?? 0) : 0;
    setCanUndo(len > 0);
  }, [drawingCardId]);

  useEffect(() => { const t = setTimeout(() => setShowTooltip(false), 6000); return () => clearTimeout(t); }, []);
  useEffect(() => {
    const handler = () => setContextMenu((c) => ({ ...c, visible: false }));
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, []);

  // Clipboard paste
  useEffect(() => {
    async function handlePaste(e: ClipboardEvent) {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) await addImageCard(file);
          break;
        }
      }
    }
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Keyboard shortcuts ───────────────────────────────────────────
  const shortcutsRef = useRef(shortcuts);
  useEffect(() => { shortcutsRef.current = shortcuts; }, [shortcuts]);
  const drawingCardIdRef = useRef(drawingCardId);
  useEffect(() => { drawingCardIdRef.current = drawingCardId; }, [drawingCardId]);

  useEffect(() => {
    async function onKey(e: KeyboardEvent) {
      // Don't fire when typing in an input/textarea (except Escape)
      const target = e.target as HTMLElement;
      const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;
      const sc = shortcutsRef.current;

      if (matchesShortcut(e, sc.undoDraw)) {
        if (drawingCardIdRef.current) { e.preventDefault(); handleUndo(); }
        return;
      }
      if (matchesShortcut(e, sc.closeToolbar)) {
        if (drawingCardIdRef.current) {
          e.preventDefault();
          setDrawToolbar((d) => ({ ...d, visible: false }));
          setDrawingCardId(null);
        }
        return;
      }
      // createText fires even when an input is focused (so you can always summon it)
      if (matchesShortcut(e, sc.createText)) { e.preventDefault(); setShowQuickText(true); return; }
      if (isInput) return;
      if (matchesShortcut(e, sc.uploadImage)) { e.preventDefault(); fileInputRef.current?.click(); return; }
      if (matchesShortcut(e, sc.screenshot)) { e.preventDefault(); await startScreenshot(); return; }
      if (matchesShortcut(e, "ctrl+shift+a")) {
        e.preventDefault();
        setAllHidden((prev) => {
          const next = !prev;
          setCards((cards) => cards.map((c) => ({ ...c, visible: c.visible ? !next : c.visible })));
          return next;
        });
        return;
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleUndo]);

  // ─── Screenshot ──────────────────────────────────────────────────
  const startScreenshot = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: { cursor: "never" } as MediaTrackConstraints, audio: false } as DisplayMediaStreamOptions);
      const video = document.createElement("video");
      video.srcObject = stream; video.autoplay = true;
      await new Promise<void>((res) => { video.onloadedmetadata = () => { video.play(); res(); }; });
      setScreenshotStream({ stream, videoEl: video });
    } catch { /* cancelled */ }
  }, []);

  const handleScreenshotCrop = useCallback(async (x: number, y: number, w: number, h: number) => {
    if (!screenshotStream) return;
    const { stream, videoEl } = screenshotStream;
    const offscreen = document.createElement("canvas");
    offscreen.width = videoEl.videoWidth; offscreen.height = videoEl.videoHeight;
    offscreen.getContext("2d")?.drawImage(videoEl, 0, 0);
    stream.getTracks().forEach((t) => t.stop());
    setScreenshotStream(null);
    const scaleX = videoEl.videoWidth / window.innerWidth;
    const scaleY = videoEl.videoHeight / window.innerHeight;
    const crop = document.createElement("canvas");
    crop.width = Math.round(w * scaleX); crop.height = Math.round(h * scaleY);
    crop.getContext("2d")?.drawImage(offscreen, Math.round(x * scaleX), Math.round(y * scaleY), crop.width, crop.height, 0, 0, crop.width, crop.height);
    const blob = await (await fetch(crop.toDataURL("image/png"))).blob();
    await addImageCard(new File([blob], "screenshot.png", { type: "image/png" }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screenshotStream]);

  const cancelScreenshot = useCallback(() => {
    screenshotStream?.stream.getTracks().forEach((t) => t.stop());
    setScreenshotStream(null);
  }, [screenshotStream]);

  // ─── Add cards ───────────────────────────────────────────────────
  const addTextCard = useCallback((content: string) => {
    if (!content.trim()) return;
    const id = generateId();
    const canvas = canvasRef.current;
    const cx = canvas ? canvas.clientWidth / 2 - 140 : 100;
    const cy = canvas ? canvas.clientHeight / 2 - 60 : 100;
    const card: TextCard = { id, type: "text", content: content.trim(), position: { x: Math.max(16, cx), y: Math.max(16, cy) }, size: { width: 280, height: 40 }, visible: true, opacity: 1, createdAt: Date.now() };
    setCards((prev) => [...prev, card]);
  }, [canvasRef]);

  const addImageCard = useCallback(async (file: File) => {
    const id = generateId();
    const [dataUrl, base64] = await Promise.all([fileToDataUrl(file), fileToBase64(file)]);
    const canvas = canvasRef.current;
    const cx = canvas ? canvas.clientWidth / 2 - 150 : 100;
    const cy = canvas ? canvas.clientHeight / 2 - 100 : 100;
    const card: ImageCard = { id, type: "image", src: dataUrl, fileName: file.name, position: { x: Math.max(16, cx), y: Math.max(16, cy) }, size: { width: 300, height: 200 }, visible: true, opacity: 1, createdAt: Date.now() };
    setCards((prev) => [...prev, card]);
    setOcrLoading(id);
    try {
      const res = await fetch("/api/ocr", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ imageBase64: base64, mimeType: file.type }) });
      const { text } = await res.json();
      if (text) setCards((prev) => prev.map((c) => c.id === id ? { ...c, ocrText: text } as ImageCard : c));
    } catch { /* non-critical */ } finally { setOcrLoading(null); }
  }, [canvasRef]);

  // ─── Card mutations ──────────────────────────────────────────────
  const ejectCard = useCallback((id: string) => setCards((p) => p.map((c) => c.id === id ? { ...c, visible: true } : c)), []);
  const hideCard = useCallback((id: string) => setCards((p) => p.map((c) => c.id === id ? { ...c, visible: false } : c)), []);
  const deleteCard = useCallback((id: string) => {
    setCards((p) => p.filter((c) => c.id !== id));
    undoStacks.current.delete(id);
    drawCanvasRefs.current.delete(id);
    setContextMenu((c) => ({ ...c, visible: false }));
    setDrawToolbar((d) => ({ ...d, visible: d.cardId === id ? false : d.visible }));
  }, []);
  const bulkDeleteSelected = useCallback(() => {
    setCards((p) => p.filter((c) => !selectedCards.has(c.id)));
    setSelectedCards(new Set());
  }, [selectedCards]);
  const updateCardPosition = useCallback((id: string, pos: { x: number; y: number }) => setCards((p) => p.map((c) => c.id === id ? { ...c, position: pos } : c)), []);
  const updateCardSize = useCallback((id: string, size: { width: number; height: number }) => setCards((p) => p.map((c) => c.id === id ? { ...c, size } : c)), []);
  const updateCardContent = useCallback((id: string, content: string) => setCards((p) => p.map((c) => c.id === id && c.type === "text" ? { ...c, content } : c)), []);

  // ─── Context menu ────────────────────────────────────────────────
  const openContextMenu = useCallback((e: React.MouseEvent, cardId: string, cardType: "text" | "image") => {
    e.preventDefault(); e.stopPropagation();
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY, cardId, cardType });
  }, []);
  const handleContextShowToolbar = useCallback(() => {
    if (!contextMenu.cardId) return;
    setDrawToolbar({ visible: true, cardId: contextMenu.cardId, x: contextMenu.x + 10, y: contextMenu.y - 60 });
    setDrawingCardId(contextMenu.cardId);
    setContextMenu((c) => ({ ...c, visible: false }));
  }, [contextMenu]);
  const handleContextDelete = useCallback(() => {
    if (!contextMenu.cardId) return;
    setDeleteConfirm({ visible: true, cardId: contextMenu.cardId, isBulk: false });
    setContextMenu((c) => ({ ...c, visible: false }));
  }, [contextMenu]);

  const handleContextCopyImage = useCallback(async () => {
    const card = cards.find((c) => c.id === contextMenu.cardId && c.type === "image");
    if (!card) return;
    const src = (card as ImageCard).src;
    try {
      // Fetch the image as a blob and write to clipboard
      const res = await fetch(src);
      const blob = await res.blob();
      // Normalise to image/png which ClipboardItem requires in most browsers
      let pngBlob = blob;
      if (blob.type !== "image/png") {
        const bmp = await createImageBitmap(blob);
        const canvas = document.createElement("canvas");
        canvas.width = bmp.width; canvas.height = bmp.height;
        canvas.getContext("2d")!.drawImage(bmp, 0, 0);
        pngBlob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), "image/png"));
      }
      await navigator.clipboard.write([new ClipboardItem({ "image/png": pngBlob })]);
    } catch (err) {
      console.warn("Copy image failed:", err);
    }
  }, [cards, contextMenu.cardId]);

  const closeToolbarIfOtherCard = useCallback((cardId: string) => {
    if (drawingCardId && drawingCardId !== cardId) {
      setDrawToolbar((d) => ({ ...d, visible: false }));
      setDrawingCardId(null);
    }
  }, [drawingCardId]);

  // ─── Card box drag ────────────────────────────────────────────────
  const onBoxDragEnd = useCallback((x: number, y: number) => {
    const container = canvasRef.current;
    if (!container) return;
    const { clientWidth: cw, clientHeight: ch } = container;
    const edge = detectEdge(x, y, boxState.width, 400, cw, ch, 50);
    if (edge !== "none") {
      let snapX = x, snapY = y;
      if (edge === "left")   snapX = -(boxState.width - 16);
      if (edge === "right")  snapX = cw - 16;
      if (edge === "top")    snapY = -380;
      if (edge === "bottom") snapY = ch - 16;
      setBoxState((b) => ({ ...b, position: { x: snapX, y: snapY }, collapsed: true, edge }));
    } else {
      setBoxState((b) => ({ ...b, position: { x: clamp(x, 0, cw - boxState.width), y: clamp(y, 0, ch - 50) }, collapsed: false, edge: "none" }));
    }
  }, [canvasRef, boxState.width]);

  const expandBox = useCallback(() => {
    setBoxState((b) => ({ ...b, collapsed: false, edge: "none", position: { x: clamp(b.position.x, 0, (canvasRef.current?.clientWidth ?? 800) - b.width), y: clamp(b.position.y, 0, (canvasRef.current?.clientHeight ?? 600) - 50) } }));
  }, [canvasRef]);

  const ejectedCards = cards.filter((c) => c.visible);

  return (
    <div ref={canvasRef} className="canvas-area relative w-full h-svh overflow-hidden"
      style={{ background: "var(--app-surface)", userSelect: drawingCardId ? "none" : undefined }}>
      <div className="pointer-events-none absolute top-[40%] left-1/2 -translate-x-1/2 w-[350px] h-[350px] rounded-full blur-[100px]" style={{ background: "var(--app-primary)", opacity: 0.04 }} />

      <AnimatePresence>
        {showTooltip && ejectedCards.length > 0 && <TooltipBanner onDismiss={() => setShowTooltip(false)} />}
      </AnimatePresence>

      <AnimatePresence>
        {ejectedCards.map((card) => {
          if (card.type === "text") {
            return (
              <FloatingTextCard
                key={card.id} card={card}
                isDrawing={drawingCardId === card.id}
                activeTool={activeTool} activeColor={activeColor}
                strokeSize={strokeSize} fontSize={fontSize}
                onRegisterCanvas={(el) => registerCanvas(card.id, el)}
                onStrokeDone={(snap) => pushUndoSnapshot(card.id, snap)}
                onPointerDownCard={() => closeToolbarIfOtherCard(card.id)}
                onHide={hideCard} onContextMenu={openContextMenu}
                onPositionChange={updateCardPosition} onSizeChange={updateCardSize}
                onContentChange={updateCardContent} canvasRef={canvasRef}
              />
            );
          }
          return (
            <FloatingImageCard
              key={card.id} card={card}
              isDrawing={drawingCardId === card.id}
              activeTool={activeTool} activeColor={activeColor}
              strokeSize={strokeSize} fontSize={fontSize}
              ocrLoading={ocrLoading === card.id}
              onRegisterCanvas={(el) => registerCanvas(card.id, el)}
              onStrokeDone={(snap) => pushUndoSnapshot(card.id, snap)}
              onPointerDownCard={() => closeToolbarIfOtherCard(card.id)}
              onHide={hideCard} onContextMenu={openContextMenu}
              onPositionChange={updateCardPosition} onSizeChange={updateCardSize}
              canvasRef={canvasRef}
            />
          );
        })}
      </AnimatePresence>

      <CardBoxPanel
        cards={cards} boxState={boxState} selectedCards={selectedCards}
        onSelectCard={(id) => setSelectedCards((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; })}
        onSelectAll={() => setSelectedCards(new Set(cards.map((c) => c.id)))}
        onDeselectAll={() => setSelectedCards(new Set())}
        onEjectCard={ejectCard} onHideCard={hideCard}
        onDeleteCard={(id) => setDeleteConfirm({ visible: true, cardId: id, isBulk: false })}
        onBulkDelete={() => setDeleteConfirm({ visible: true, cardId: null, isBulk: true })}
        onDragEnd={onBoxDragEnd} onExpand={expandBox}
        onOpenSettings={() => setShowSettings(true)}
        canvasRef={canvasRef}
      />

      <AnimatePresence>
        {contextMenu.visible && (
          <ContextMenu x={contextMenu.x} y={contextMenu.y} cardType={contextMenu.cardType}
            onShowToolbar={handleContextShowToolbar}
            onCopyImage={handleContextCopyImage}
            onDelete={handleContextDelete}
            onClose={() => setContextMenu((c) => ({ ...c, visible: false }))}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {drawToolbar.visible && drawToolbar.cardId && (
          <DrawToolbar
            x={drawToolbar.x} y={drawToolbar.y}
            activeTool={activeTool} activeColor={activeColor}
            strokeSize={strokeSize} fontSize={fontSize}
            canUndo={canUndo}
            cardType={cards.find((c) => c.id === drawToolbar.cardId)?.type ?? "image"}
            onToolChange={setActiveTool} onColorChange={setActiveColor}
            onStrokeSizeChange={setStrokeSize} onFontSizeChange={setFontSize}
            onUndo={handleUndo}
            onClose={() => { setDrawToolbar((d) => ({ ...d, visible: false })); setDrawingCardId(null); }}
          />
        )}
      </AnimatePresence>

      {/* Hidden file input for upload */}
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) addImageCard(f); e.target.value = ""; }}
      />

      <AnimatePresence>
        {deleteConfirm.visible && (
          <DeleteConfirmDialog
            isBulk={deleteConfirm.isBulk} selectedCount={selectedCards.size}
            onConfirm={() => {
              if (deleteConfirm.isBulk) bulkDeleteSelected();
              else if (deleteConfirm.cardId) deleteCard(deleteConfirm.cardId);
              setDeleteConfirm({ visible: false, cardId: null, isBulk: false });
            }}
            onCancel={() => setDeleteConfirm({ visible: false, cardId: null, isBulk: false })}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {screenshotStream && (
          <ScreenshotOverlay videoEl={screenshotStream.videoEl} onCrop={handleScreenshotCrop} onCancel={cancelScreenshot} />
        )}
      </AnimatePresence>

      {/* Quick text input (shortcut-triggered) */}
      <AnimatePresence>
        {showQuickText && (
          <QuickTextInput
            onConfirm={(text) => { addTextCard(text); setShowQuickText(false); }}
            onCancel={() => setShowQuickText(false)}
          />
        )}
      </AnimatePresence>

      {/* Settings panel */}
      <AnimatePresence>
        {showSettings && (
          <SettingsPanel
            shortcuts={shortcuts}
            onSave={(cfg) => setShortcuts(cfg)}
            onClose={() => setShowSettings(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
