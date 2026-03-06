import '@testing-library/jest-dom';

// Polyfills or global mocks required for jsdom
if (typeof window.matchMedia !== 'function') {
    window.matchMedia = (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => { }, // Deprecated
        removeListener: () => { }, // Deprecated
        addEventListener: () => { },
        removeEventListener: () => { },
        dispatchEvent: () => false,
    });
}

class LocalStorageMock {
    store: Record<string, string> = {};
    clear() { this.store = {}; }
    getItem(key: string) { return this.store[key] || null; }
    setItem(key: string, value: string) { this.store[key] = String(value); }
    removeItem(key: string) { delete this.store[key]; }
}

(global as any).localStorage = new LocalStorageMock();
(global as any).sessionStorage = new LocalStorageMock();
