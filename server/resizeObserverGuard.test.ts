import { describe, expect, it } from "vitest";
import { isResizeObserverLoopError } from "../client/src/lib/resizeObserverGuard";

describe("resizeObserverGuard", () => {
  it("identifica somente o diagnóstico benigno do ResizeObserver", () => {
    expect(isResizeObserverLoopError("ResizeObserver loop completed with undelivered notifications.")).toBe(true);
    expect(isResizeObserverLoopError("ResizeObserver loop limit exceeded")).toBe(false);
    expect(isResizeObserverLoopError("TypeError: real application failure")).toBe(false);
    expect(isResizeObserverLoopError(undefined)).toBe(false);
  });
});
