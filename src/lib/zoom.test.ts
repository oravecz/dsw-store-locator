import { describe, expect, it } from "vitest";
import { preventDocumentZoom } from "./zoom";

const touchMove = (touchCount: number) => {
  const event = new Event("touchmove", {
    bubbles: true,
    cancelable: true,
  });
  Object.defineProperty(event, "touches", {
    value: Array.from({ length: touchCount }, () => ({})),
  });
  return event;
};

describe("zoom prevention", () => {
  it("prevents double-click and Safari gesture zoom", () => {
    const cleanup = preventDocumentZoom();
    const doubleClick = new Event("dblclick", { cancelable: true });
    const pinch = new Event("gesturestart", { cancelable: true });

    document.dispatchEvent(doubleClick);
    document.dispatchEvent(pinch);

    expect(doubleClick.defaultPrevented).toBe(true);
    expect(pinch.defaultPrevented).toBe(true);
    cleanup();
  });

  it("prevents multi-touch movement without blocking one-finger scrolling", () => {
    const cleanup = preventDocumentZoom();
    const oneFinger = touchMove(1);
    const twoFingers = touchMove(2);

    document.dispatchEvent(oneFinger);
    document.dispatchEvent(twoFingers);

    expect(oneFinger.defaultPrevented).toBe(false);
    expect(twoFingers.defaultPrevented).toBe(true);
    cleanup();
  });
});
