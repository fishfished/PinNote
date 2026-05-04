"use client";

import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function CardOptionsPage() {
  const router = useRouter();

  return (
    <div className="relative w-full h-svh overflow-hidden bg-[var(--app-surface)]">
      {/* Close background hit area */}
      <button
        aria-label="关闭"
        className="absolute inset-0 z-0"
        onClick={() => router.push("/")}
      />

      {/* Target image preview */}
      <div className="absolute top-[25%] left-4 lg:left-12 w-[220px] pointer-events-none z-10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt="Architecture Diagram Focus"
          className="w-full h-auto opacity-100 rounded-lg"
          style={{ filter: "drop-shadow(0 12px 30px rgba(0,0,0,0.7))" }}
          src="https://images.unsplash.com/photo-1618761714954-0b8cd0026356?auto=format&fit=crop&w=400&q=80"
        />
      </div>

      {/* Context menu */}
      <nav
        className="absolute top-[48%] left-[20%] w-[180px] rounded-xl shadow-2xl overflow-hidden flex flex-col py-1 z-30"
        style={{ background: "var(--app-surface)", border: "1px solid var(--app-border)" }}
      >
        <button
          className="w-full text-left px-4 py-3 text-[14px] flex justify-between items-center transition-colors font-medium"
          style={{ color: "var(--app-text)" }}
          onClick={() => undefined}
          onMouseEnter={(e) =>
            (((e.currentTarget as HTMLElement).style.background =
              "color-mix(in srgb, var(--app-text) 6%, transparent)") as unknown as void)
          }
          onMouseLeave={(e) =>
            (((e.currentTarget as HTMLElement).style.background =
              "transparent") as unknown as void)
          }
        >
          Show Toolbar
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ color: "var(--app-text-secondary)" }}
          >
            <path d="m14 18 4-4-4-4" />
            <path d="M6 14v4" />
            <path d="M6 6v4" />
          </svg>
        </button>
        <div className="h-[1px] w-full" style={{ background: "var(--app-border)" }} />
        <button
          className="w-full text-left px-4 py-3 text-[14px] flex justify-between items-center transition-colors font-medium"
          style={{ color: "var(--app-danger)" }}
          onClick={() => undefined}
          onMouseEnter={(e) =>
            (((e.currentTarget as HTMLElement).style.background =
              "color-mix(in srgb, var(--app-danger) 10%, transparent)") as unknown as void)
          }
          onMouseLeave={(e) =>
            (((e.currentTarget as HTMLElement).style.background =
              "transparent") as unknown as void)
          }
        >
          Delete Element
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
      </nav>

      {/* Drawing toolbar preview */}
      <aside
        className="absolute top-[28%] right-[10%] rounded-full p-1.5 flex flex-col gap-1.5 z-40"
        style={{
          background: "var(--app-accent)",
          border: "1px solid var(--app-border)",
          boxShadow: "0 10px 30px rgba(0,0,0,0.8)",
          backdropFilter: "blur(12px)",
        }}
      >
        <ToolBtn active={false} label="Pen Tool">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
          </svg>
        </ToolBtn>
        <ToolBtn active label="Highlighter Tool">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m9 11-6 6v3h9l3-3" />
            <path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4" />
          </svg>
        </ToolBtn>
        <ToolBtn active={false} label="Eraser Tool">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21" />
            <path d="M22 21H7" />
            <path d="m5 11 9 9" />
          </svg>
        </ToolBtn>
      </aside>

      {/* Close button */}
      <button
        aria-label="Close Options"
        className="absolute top-6 right-6 p-2 rounded-full z-50 transition-colors"
        style={{
          background: "var(--app-surface)",
          border: "1px solid var(--app-border)",
          boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
          color: "var(--app-text-secondary)",
        }}
        onClick={() => router.push("/")}
        onMouseEnter={(e) =>
          (((e.currentTarget as HTMLElement).style.color =
            "var(--app-text)") as unknown as void)
        }
        onMouseLeave={(e) =>
          (((e.currentTarget as HTMLElement).style.color =
            "var(--app-text-secondary)") as unknown as void)
        }
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </svg>
      </button>
    </div>
  );
}

function ToolBtn({
  active,
  label,
  children,
}: {
  active: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      aria-label={label}
      className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
      style={
        active
          ? {
              color: "var(--app-primary)",
              background: "color-mix(in srgb, var(--app-primary) 10%, transparent)",
              border: "1px solid color-mix(in srgb, var(--app-primary) 20%, transparent)",
              boxShadow: "inset 0 1px 3px rgba(0,0,0,0.35)",
            }
          : {
              color: "var(--app-text-secondary)",
              background: "transparent",
              border: "1px solid transparent",
            }
      }
    >
      {children}
    </button>
  );
}
