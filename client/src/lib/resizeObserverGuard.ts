const RESIZE_OBSERVER_LOOP_ERROR = "ResizeObserver loop completed with undelivered notifications.";

/**
 * Chromium emits this diagnostic when a ResizeObserver delivery is deferred to
 * the next frame. It is not an application exception and has no stack trace.
 * Keep the predicate exact so real runtime errors remain visible.
 */
export function isResizeObserverLoopError(message: string | undefined) {
  return message === RESIZE_OBSERVER_LOOP_ERROR;
}

export function installResizeObserverGuard() {
  if (typeof window === "undefined") return () => undefined;

  const handleError = (event: ErrorEvent) => {
    if (!isResizeObserverLoopError(event.message)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
  };

  window.addEventListener("error", handleError, true);
  return () => window.removeEventListener("error", handleError, true);
}
