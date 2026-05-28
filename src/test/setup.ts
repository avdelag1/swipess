import '@testing-library/jest-dom';

// Polyfills or global mocks required for jsdom
if (typeof window.matchMedia !== 'function') {
    window.matchMedia = (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => { },
        removeListener: () => { },
        addEventListener: () => { },
        removeEventListener: () => { },
        dispatchEvent: () => false,
    });
}

// Ensure localStorage is a proper Storage for Supabase auth and Index navigation
const makeMockStorage = (): Storage => {
    const store: Record<string, string> = {};
    return {
        getItem: (key: string) => store[key] ?? null,
        setItem: (key: string, value: string) => { store[key] = String(value); },
        removeItem: (key: string) => { delete store[key]; },
        clear: () => { Object.keys(store).forEach(k => delete store[k]); },
        key: (index: number) => Object.keys(store)[index] ?? null,
        get length() { return Object.keys(store).length; },
    } as Storage;
};
const mockStorage = makeMockStorage();
Object.defineProperty(globalThis, 'localStorage', {
    value: mockStorage,
    writable: true,
    configurable: true,
});
Object.defineProperty(window, 'localStorage', {
    value: mockStorage,
    writable: true,
    configurable: true,
});


