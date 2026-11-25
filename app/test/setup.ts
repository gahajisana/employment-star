import "@testing-library/jest-dom/vitest";

// jsdom lacks these browser APIs; Ant Design layout components need them.
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (media: string) => ({
    matches: false,
    media,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
  }),
});

globalThis.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};
