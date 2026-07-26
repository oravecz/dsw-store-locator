export interface SwipePoint {
  x: number;
  y: number;
}

export interface EdgeBackSwipeFeedback {
  active: boolean;
  distance: number;
  progress: number;
  ready: boolean;
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

// @lat: [[dsw-store-locator#Store Navigation#Back Gesture Feedback]]
export function getEdgeBackSwipeFeedback(
  start: SwipePoint,
  current: SwipePoint,
): EdgeBackSwipeFeedback {
  const horizontalDistance = current.x - start.x;
  const verticalDistance = Math.abs(current.y - start.y);
  const distance = Math.max(0, horizontalDistance);
  const fromLeftEdge = start.x <= edgeWidth;
  const horizontalIntent =
    horizontalDistance > 0 && horizontalDistance > verticalDistance;
  const ready =
    fromLeftEdge &&
    horizontalDistance >= minimumSwipeDistance &&
    horizontalDistance > verticalDistance * 1.25;

  return {
    active: fromLeftEdge && horizontalIntent,
    distance,
    progress: Math.min(distance / minimumSwipeDistance, 1),
    ready,
  };
}

export function isEdgeBackSwipe(start: SwipePoint, end: SwipePoint) {
  return getEdgeBackSwipeFeedback(start, end).ready;
}
