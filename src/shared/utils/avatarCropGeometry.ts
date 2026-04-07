/**
 * Pure math for square avatar crop: cover-scale, pan clamp, and natural-pixel crop rect.
 */

export function coverScale(naturalW: number, naturalH: number, cropViewportPx: number): number {
  return Math.max(cropViewportPx / naturalW, cropViewportPx / naturalH);
}

export function clampPan(
  tx: number,
  ty: number,
  dispW: number,
  dispH: number,
  cropSize: number,
): { tx: number; ty: number } {
  const minX = cropSize - dispW;
  const maxX = 0;
  const minY = cropSize - dispH;
  const maxY = 0;
  return {
    tx: Math.max(minX, Math.min(maxX, tx)),
    ty: Math.max(minY, Math.min(maxY, ty)),
  };
}

export function naturalSquareCrop(
  nw: number,
  nh: number,
  cropSizePx: number,
  scale: number,
  tx: number,
  ty: number,
): { originX: number; originY: number; size: number } {
  const side = cropSizePx / scale;
  let originX = Math.round(-tx / scale);
  let originY = Math.round(-ty / scale);
  const sideInt = Math.round(side);
  const maxX = Math.max(0, nw - sideInt);
  const maxY = Math.max(0, nh - sideInt);
  originX = Math.max(0, Math.min(maxX, originX));
  originY = Math.max(0, Math.min(maxY, originY));
  return { originX, originY, size: sideInt };
}
