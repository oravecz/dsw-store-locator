export interface SwipePoint {
  x: number;
  y: number;
}

const edgeWidth = 32;
const minimumSwipeDistance = 72;

export const openStoreNavigation = (storeNumber: string) => [storeNumber];

export function pushStoreNavigation(
  history: string[],
  storeNumber: string,
) {
  return history.at(-1) === storeNumber
    ? history
    : [...history, storeNumber];
}

export const popStoreNavigation = (history: string[]) =>
  history.slice(0, -1);

export function isEdgeBackSwipe(start: SwipePoint, end: SwipePoint) {
  const horizontalDistance = end.x - start.x;
  const verticalDistance = Math.abs(end.y - start.y);

  return (
    start.x <= edgeWidth &&
    horizontalDistance >= minimumSwipeDistance &&
    horizontalDistance > verticalDistance * 1.25
  );
}
