// Shortcut configuration types and storage

export interface ShortcutConfig {
  /** Create a text card */
  createText: string;
  /** Open image upload dialog */
  uploadImage: string;
  /** Start screenshot selection */
  screenshot: string;
  /** Undo drawing stroke */
  undoDraw: string;
  /** Close the active drawing toolbar */
  closeToolbar: string;
}

export const DEFAULT_SHORTCUTS: ShortcutConfig = {
  createText:  "ctrl+shift+h",
  uploadImage: "ctrl+shift+u",
  screenshot:  "ctrl+shift+s",
  undoDraw:    "ctrl+z",
  closeToolbar: "escape",
};

export const SHORTCUT_LABELS: Record<keyof ShortcutConfig, string> = {
  createText:   "创建文字卡片",
  uploadImage:  "上传图片",
  screenshot:   "截图框选",
  undoDraw:     "撤销绘图",
  closeToolbar: "关闭当前工具栏",
};

const STORAGE_KEY = "pinnote_shortcuts_v2";

export function loadShortcuts(): ShortcutConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SHORTCUTS };
    return { ...DEFAULT_SHORTCUTS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_SHORTCUTS };
  }
}

export function saveShortcuts(cfg: ShortcutConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
  } catch { /* ignore */ }
}

/** Parse a KeyboardEvent into a canonical shortcut string like "ctrl+shift+t" */
export function eventToShortcut(e: KeyboardEvent): string {
  const parts: string[] = [];
  if (e.ctrlKey || e.metaKey) parts.push("ctrl");
  if (e.shiftKey) parts.push("shift");
  if (e.altKey) parts.push("alt");
  const key = e.key.toLowerCase();
  if (key !== "control" && key !== "shift" && key !== "alt" && key !== "meta") {
    parts.push(key);
  }
  return parts.join("+");
}

/** Check if a KeyboardEvent matches a shortcut string */
export function matchesShortcut(e: KeyboardEvent, shortcut: string): boolean {
  return eventToShortcut(e) === shortcut;
}

/** Format a shortcut string for display, e.g. "ctrl+shift+t" → "Ctrl+Shift+T" */
export function displayShortcut(shortcut: string): string {
  return shortcut
    .split("+")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" + ");
}
