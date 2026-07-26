import type { SwipePoint } from "./store-navigation";

const pullStartZone = 88;
const minimumPullDistance = 64;

export function isCampaignDrawerPull(
  start: SwipePoint,
  end: SwipePoint,
  scrollTop: number,
) {
  const verticalDistance = end.y - start.y;
  const horizontalDistance = Math.abs(end.x - start.x);

  return (
    scrollTop <= 1 &&
    start.y <= pullStartZone &&
    verticalDistance >= minimumPullDistance &&
    verticalDistance > horizontalDistance * 1.25
  );
}
