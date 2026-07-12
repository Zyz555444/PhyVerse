import '@testing-library/jest-dom/vitest'

if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => {},
    }),
  })

  Object.defineProperty(window, 'IntersectionObserver', {
    writable: true,
    value: class IntersectionObserverMock {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  })
}

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

globalThis.ResizeObserver = ResizeObserverMock

const consoleError = console.error
console.error = (...args: unknown[]) => {
  // Suppress React act() warnings in tests
  const message = args[0]?.toString() ?? ''
  if (message.includes('act(')) return
  consoleError(...args)
}
