// Core types for PinNote cards

export type CardType = "text" | "image";

export interface CardPosition {
  x: number;
  y: number;
}

export interface CardSize {
  width: number;
  height: number;
}

export interface BaseCard {
  id: string;
  type: CardType;
  position: CardPosition;
  size: CardSize;
  visible: boolean; // whether ejected / shown on canvas
  opacity: number;  // 0-1
  createdAt: number;
}

export interface TextCard extends BaseCard {
  type: "text";
  content: string;
}

export interface ImageCard extends BaseCard {
  type: "image";
  src: string; // data URL or object URL
  ocrText?: string;
  fileName?: string;
}

export type PinCard = TextCard | ImageCard;

// CardBox state
export interface CardBoxState {
  position: CardPosition;
  width: number;
  collapsed: boolean; // snapped to edge = collapsed
  edge: "none" | "left" | "right" | "top" | "bottom";
}

export type DrawTool = "pen" | "rect" | "rect-solid" | "ellipse" | "ellipse-solid" | "eraser" | "text";

export interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  cardId: string | null;
  cardType: CardType | null;
}

export interface DrawToolbarState {
  visible: boolean;
  cardId: string | null;
  x: number;
  y: number;
}

export interface DeleteConfirmState {
  visible: boolean;
  cardId: string | null;
  isBulk: boolean;
}
