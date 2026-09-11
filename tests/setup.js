import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { JSDOM } from "jsdom";
import { afterAll, afterEach, beforeEach, vi } from "vitest";

// Use browser Storage rather than Node 25's experimental global implementation.
const storageWindow = new JSDOM("", { url: "http://localhost:3000" }).window;
vi.stubGlobal("localStorage", storageWindow.localStorage);
vi.stubGlobal("Storage", storageWindow.Storage);
beforeEach(() => localStorage.clear());
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
afterAll(() => {
  storageWindow.close();
  vi.unstubAllGlobals();
});
