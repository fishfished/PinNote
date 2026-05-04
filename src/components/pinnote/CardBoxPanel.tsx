"use client";

import { useRef, useCallback, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { PinCard, CardBoxState } from "@/types/cards";
import { clamp } from "@/utils/cardUtils";

interface Props {
  cards: PinCard[];
  boxState: CardBoxState;
  selectedCards: Set<string>;
  onSelectCard: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onEjectCard: (id: string) => void;
  onHideCard: (id: string) => void;
  onDeleteCard: (id: string) => void;
  onBulkDelete: () => void;
  onDragEnd: (x: number, y: number) => void;
  onExpand: () => void;
  onOpenSettings: () => void;
  canvasRef: React.RefObject<HTMLDivElement | null>;
}

export function CardBoxPanel({
  cards,
  boxState,
  selectedCards,
  onSelectCard,
  onSelectAll,
  onDeselectAll,
  onEjectCard,
  onHideCard,
  onDeleteCard,
  onBulkDelete,
  onDragEnd,
  onExpand,
  onOpenSettings,
  canvasRef,
}: Props) {
  const BOX_WIDTH = 264;
  const [localPos, setLocalPos] = useState(boxState.position);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef<
    { mx: number; my: number; bx: number; by: number } | null
  >(null);

  // Sync local pos when boxState.position changes (snap)
  useEffect(() => {
    setLocalPos(boxState.position);
  }, [boxState.position]);

  const handleHeaderPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (boxState.collapsed) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      setIsDragging(true);
      dragStart.current = {
        mx: e.clientX,
        my: e.clientY,
        bx: localPos.x,
        by: localPos.y,
      };
    },
    [boxState.collapsed, localPos]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragStart.current) return;
      const dx = e.clientX - dragStart.current.mx;
      const dy = e.clientY - dragStart.current.my;
      const canvas = canvasRef.current;
      const maxX = canvas ? canvas.clientWidth - BOX_WIDTH : 1000;
      const maxY = canvas ? canvas.clientHeight - 50 : 1000;
      setLocalPos({
        x: clamp(
          dragStart.current.bx + dx,
          -BOX_WIDTH + 20,
          maxX + BOX_WIDTH - 20
        ),
        y: clamp(dragStart.current.by + dy, -400, maxY + 400),
      });
    },
    [canvasRef]
  );

  const handlePointerUp = useCallback(() => {
    if (!dragStart.current) return;
    onDragEnd(localPos.x, localPos.y);
    dragStart.current = null;
    setIsDragging(false);
  }, [localPos, onDragEnd]);

  // Edge snap reveal strip
  if (boxState.collapsed) {
    const edge = boxState.edge;
    let stripStyle: React.CSSProperties = {};
    let expandTitle = "";

    if (edge === "left") {
      stripStyle = {
        position: "absolute",
        left: 0,
        top: "50%",
        transform: "translateY(-50%)",
        width: 16,
        height: 80,
        borderRadius: "0 8px 8px 0",
        cursor: "pointer",
        background: "var(--app-accent-90)",
        border: "1px solid var(--app-border)",
        borderLeft: "none",
        zIndex: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      };
      expandTitle = ">";
    } else if (edge === "right") {
      stripStyle = {
        position: "absolute",
        right: 0,
        top: "50%",
        transform: "translateY(-50%)",
        width: 16,
        height: 80,
        borderRadius: "8px 0 0 8px",
        cursor: "pointer",
        background: "var(--app-accent-90)",
        border: "1px solid var(--app-border)",
        borderRight: "none",
        zIndex: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      };
      expandTitle = "<";
    } else if (edge === "top") {
      stripStyle = {
        position: "absolute",
        top: 0,
        left: "50%",
        transform: "translateX(-50%)",
        height: 16,
        width: 80,
        borderRadius: "0 0 8px 8px",
        cursor: "pointer",
        background: "var(--app-accent-90)",
        border: "1px solid var(--app-border)",
        borderTop: "none",
        zIndex: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      };
      expandTitle = "↓";
    } else {
      stripStyle = {
        position: "absolute",
        bottom: "40px",
        left: "50%",
        transform: "translateX(-50%)",
        height: 16,
        width: 80,
        borderRadius: "8px 8px 0 0",
        cursor: "pointer",
        background: "var(--app-accent-90)",
        border: "1px solid var(--app-border)",
        borderBottom: "none",
        zIndex: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      };
      expandTitle = "↑";
    }

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={onExpand}
        style={stripStyle}
        title="点击展开卡片盒"
      >
        <span
          style={{
            color: "var(--app-text-secondary)",
            fontSize: 11,
            fontWeight: 700,
          }}
        >
          {expandTitle}
        </span>
        {cards.length > 0 && (
          <span
            style={{
              position: "absolute",
              top: -6,
              right: -6,
              background: "var(--app-primary)",
              color: "var(--app-surface)",
              fontSize: 9,
              fontWeight: 700,
              borderRadius: 9999,
              padding: "1px 4px",
              minWidth: 14,
              textAlign: "center",
            }}
          >
            {cards.length}
          </span>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      style={{
        position: "absolute",
        left: localPos.x,
        top: localPos.y,
        width: BOX_WIDTH,
        zIndex: 60,
        cursor: isDragging ? "grabbing" : "default",
      }}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Box container */}
      <div
        style={{
          background: "var(--app-surface-92)",
          border: "1px solid var(--app-border)",
          borderRadius: 16,
          backdropFilter: "blur(20px)",
          boxShadow: "0 20px 50px color-mix(in srgb, black 70%, transparent)",
          overflow: "hidden",
        }}
      >
        {/* Header — drag handle */}
        <div
          onPointerDown={handleHeaderPointerDown}
          style={{
            padding: "10px 12px 8px",
            cursor: "grab",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid var(--app-border)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ color: "var(--app-primary)" }}>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 17v5" />
                <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z" />
              </svg>
            </div>
            <span
              style={{
                color: "var(--app-text)",
                fontWeight: 600,
                fontSize: 13,
              }}
            >
              卡片盒
            </span>
            <span
              style={{
                background: "var(--app-surface)",
                color: "var(--app-text-secondary)",
                borderRadius: 9999,
                padding: "1px 6px",
                fontSize: 10,
                fontWeight: 700,
                border: "1px solid var(--app-border)",
              }}
            >
              {cards.length}
            </span>
          </div>

          {/* Bulk actions */}
          {selectedCards.size > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ color: "var(--app-text-secondary)", fontSize: 11 }}>
                已选 {selectedCards.size}
              </span>
              <button
                onClick={onBulkDelete}
                style={{
                  padding: "3px 8px",
                  borderRadius: 6,
                  background: "color-mix(in srgb, var(--app-danger) 12%, transparent)",
                  color: "var(--app-danger)",
                  fontSize: 11,
                  fontWeight: 600,
                  border: "1px solid color-mix(in srgb, var(--app-danger) 20%, transparent)",
                }}
              >
                删除
              </button>
            </div>
          )}
        </div>

        {/* Card list */}
        <div
          className="card-box-list"
          style={{
            maxHeight: 320,
            overflowY: "auto",
            padding: "6px",
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          {cards.length === 0 && (
            <div
              style={{
                padding: "24px 16px",
                textAlign: "center",
                color: "var(--app-text-muted)",
                fontSize: 12,
                lineHeight: 1.6,
              }}
            >
              在下方输入文字或上传图片
              <br />
              新卡片会出现在这里
            </div>
          )}

          <AnimatePresence>
            {cards.map((card) => (
              <BoxCardRow
                key={card.id}
                card={card}
                selected={selectedCards.has(card.id)}
                onSelect={() => onSelectCard(card.id)}
                onEject={() => onEjectCard(card.id)}
                onHide={() => onHideCard(card.id)}
                onDelete={() => onDeleteCard(card.id)}
              />
            ))}
          </AnimatePresence>
        </div>

        {/* Footer actions */}
        <div style={{ padding: "6px 10px", borderTop: "1px solid var(--app-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {cards.length > 0 ? (
            <button onClick={selectedCards.size === cards.length ? onDeselectAll : onSelectAll}
              style={{ color: "var(--app-text-secondary)", fontSize: 11, cursor: "pointer" }}>
              {selectedCards.size === cards.length ? "取消全选" : "全选"}
            </button>
          ) : (
            <span style={{ color: "var(--app-text-muted)", fontSize: 11 }}>暂无卡片</span>
          )}
          <button onClick={onOpenSettings} title="设置"
            style={{ color: "var(--app-text-secondary)", display: "flex", alignItems: "center", gap: 4, fontSize: 11, cursor: "pointer" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--app-text)")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--app-text-secondary)")}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/><path d="M12 2v3m0 14v3M4.22 4.22l2.12 2.12m11.32 11.32 2.12 2.12M2 12h3m14 0h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/>
            </svg>
            设置
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function BoxCardRow({
  card,
  selected,
  onSelect,
  onEject,
  onHide,
  onDelete,
}: {
  card: PinCard;
  selected: boolean;
  onSelect: () => void;
  onEject: () => void;
  onHide: () => void;
  onDelete: () => void;
}) {
  const label =
    card.type === "text"
      ? card.content.slice(0, 40) + (card.content.length > 40 ? "…" : "")
      : (card as import("@/types/cards").ImageCard).fileName ?? "图片";

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "7px 8px",
        borderRadius: 10,
        background: selected
          ? "color-mix(in srgb, var(--app-primary) 8%, transparent)"
          : "transparent",
        border: selected
          ? "1px solid color-mix(in srgb, var(--app-primary) 15%, transparent)"
          : "1px solid transparent",
        transition: "background 0.15s ease",
      }}
    >
      {/* Checkbox */}
      <button
        onClick={onSelect}
        aria-label={selected ? "取消选择" : "选择"}
        style={{
          width: 16,
          height: 16,
          borderRadius: 4,
          border: selected
            ? "1.5px solid var(--app-primary)"
            : "1.5px solid var(--app-text-secondary)",
          background: selected ? "var(--app-primary)" : "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          transition: "all 0.15s ease",
        }}
      >
        {selected && (
          <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
            <path
              d="M2 6l3 3 5-5"
              stroke="var(--app-surface)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>

      {/* Type icon */}
      <div style={{ color: "var(--app-text-secondary)", flexShrink: 0 }}>
        {card.type === "image" ? (
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="9" cy="9" r="2" />
            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
          </svg>
        ) : (
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
        )}
      </div>

      {/* Label */}
      <span
        style={{
          flex: 1,
          color: "var(--app-text)",
          fontSize: 12,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          lineHeight: 1.4,
        }}
      >
        {label}
      </span>

      {/* Actions */}
      <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
        {/* Show/hide toggle */}
        <ActionBtn
          label={card.visible ? "收回" : "弹出"}
          onClick={card.visible ? onHide : onEject}
          color={card.visible ? "var(--app-primary)" : "var(--app-text-secondary)"}
        >
          {card.visible ? (
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
          ) : (
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </ActionBtn>

        {/* Delete */}
        <ActionBtn label="删除" onClick={onDelete} color="var(--app-danger)">
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 6h18" />
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
          </svg>
        </ActionBtn>
      </div>
    </motion.div>
  );
}

function ActionBtn({
  label,
  onClick,
  color,
  children,
}: {
  label: string;
  onClick: () => void;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      style={{
        width: 24,
        height: 24,
        borderRadius: 6,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color,
        transition: "background 0.15s ease",
      }}
      onMouseEnter={(e) =>
        (((e.currentTarget as HTMLElement).style.background =
          "color-mix(in srgb, var(--app-text) 6%, transparent)") as unknown as void)
      }
      onMouseLeave={(e) =>
        (((e.currentTarget as HTMLElement).style.background =
          "transparent") as unknown as void)
      }
    >
      {children}
    </button>
  );
}
