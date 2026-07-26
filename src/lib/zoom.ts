export function preventDocumentZoom(target: Document = document) {
  const preventZoom = (event: Event) => event.preventDefault();
  const preventMultiTouch = (event: TouchEvent) => {
    if (event.touches.length > 1) event.preventDefault();
  };

  target.addEventListener("dblclick", preventZoom, { passive: false });
  target.addEventListener("gesturestart", preventZoom, { passive: false });
  target.addEventListener("gesturechange", preventZoom, { passive: false });
  target.addEventListener("gestureend", preventZoom, { passive: false });
  target.addEventListener("touchmove", preventMultiTouch, { passive: false });

  return () => {
    target.removeEventListener("dblclick", preventZoom);
    target.removeEventListener("gesturestart", preventZoom);
    target.removeEventListener("gesturechange", preventZoom);
    target.removeEventListener("gestureend", preventZoom);
    target.removeEventListener("touchmove", preventMultiTouch);
  };
}
