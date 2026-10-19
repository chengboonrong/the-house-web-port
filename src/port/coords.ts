/** Scale a native SWF stage into a CSS rectangle without stretching. */
export interface Viewport { left: number; top: number; width: number; height: number }
export function fitStage(stageWidth: number, stageHeight: number, viewport: Viewport): Viewport {
  if (stageWidth <= 0 || stageHeight <= 0 || viewport.width <= 0 || viewport.height <= 0) {
    throw new Error('Positive stage and viewport dimensions are required');
  }
  const scale = Math.min(viewport.width / stageWidth, viewport.height / stageHeight);
  const width = stageWidth * scale;
  const height = stageHeight * scale;
  return { left: viewport.left + (viewport.width - width) / 2, top: viewport.top + (viewport.height - height) / 2, width, height };
}
export function pointToStage(clientX: number, clientY: number, stageWidth: number, stageHeight: number, fitted: Viewport) {
  const x = (clientX - fitted.left) * stageWidth / fitted.width;
  const y = (clientY - fitted.top) * stageHeight / fitted.height;
  if (x < 0 || y < 0 || x >= stageWidth || y >= stageHeight) return null;
  return { x, y };
}
