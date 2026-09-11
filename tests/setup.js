import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { JSDOM } from "jsdom";
import { afterAll, afterEach, beforeEach, vi } from "vitest";

// Daybook reads the active section off the router, which isn't mounted outside
// `next start`. "/all" is the section that shows every unarchived task.
vi.mock("next/navigation", () => ({
  usePathname: () => "/all",
  useRouter: () => ({
    push: () => {},
    replace: () => {},
    prefetch: () => {},
    back: () => {},
    forward: () => {},
    refresh: () => {},
  }),
  useSearchParams: () => new URLSearchParams(),
  redirect: () => {},
  notFound: () => {},
}));

// Use browser Storage rather than Node 25's experimental global implementation.
const storageWindow = new JSDOM("", { url: "http://localhost:3000" }).window;
vi.stubGlobal("localStorage", storageWindow.localStorage);
vi.stubGlobal("Storage", storageWindow.Storage);
// Browser APIs the app touches that jsdom doesn't implement.
if (!window.matchMedia)
  window.matchMedia = (query) => ({
    media: query,
    matches: false,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  });
if (!globalThis.ResizeObserver)
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
if (!Element.prototype.scrollIntoView)
  Element.prototype.scrollIntoView = () => {};

beforeEach(() => localStorage.clear());
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
afterAll(() => {
  storageWindow.close();
  vi.unstubAllGlobals();
});
