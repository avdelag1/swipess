export interface MapPinPreviewPlacement {
  left: number;
  top: number;
  transform: string;
}

/** Keep the preview card on-screen while anchoring to the pin's projected point. */
export function computeMapPinPreviewPlacement(
  x: number,
  y: number,
  viewport: { width: number; height: number },
  card: { width: number; height: number },
  opts?: { safeTop?: number; safeBottom?: number; margin?: number },
): MapPinPreviewPlacement {
  const margin = opts?.margin ?? 12;
  const safeTop = opts?.safeTop ?? 96;
  const safeBottom = opts?.safeBottom ?? 120;
  const halfW = card.width / 2;

  const placeAbove = y - card.height - margin * 2 >= safeTop;
  const transform = placeAbove
    ? `translate(-50%, calc(-100% - ${margin}px))`
    : `translate(-50%, ${margin}px)`;

  const clampedX = Math.min(
    viewport.width - halfW - margin,
    Math.max(halfW + margin, x),
  );

  let anchorY = y;
  if (placeAbove) {
    anchorY = Math.max(safeTop + card.height + margin, y);
  } else {
    anchorY = Math.min(viewport.height - safeBottom - margin, y);
  }

  return {
    left: clampedX,
    top: anchorY,
    transform,
  };
}