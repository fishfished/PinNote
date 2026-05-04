export function generateId(): string {
  return `card_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      resolve(dataUrl.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Detect which edge the box is near (within threshold px)
 */
export function detectEdge(
  x: number,
  y: number,
  width: number,
  height: number,
  containerWidth: number,
  containerHeight: number,
  threshold = 40
): "left" | "right" | "top" | "bottom" | "none" {
  if (x <= threshold) return "left";
  if (x + width >= containerWidth - threshold) return "right";
  if (y <= threshold) return "top";
  if (y + height >= containerHeight - threshold) return "bottom";
  return "none";
}
