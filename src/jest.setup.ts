import '@testing-library/jest-dom';

// Mock KaTeX for tests
window.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
}));

// Add required DOM properties for KaTeX
document.createRange = () => {
    const range = new Range();
    range.getBoundingClientRect = jest.fn();
    range.getClientRects = () => {
        return {
            item: () => null,
            length: 0,
            [Symbol.iterator]: jest.fn()
        };
    };
    return range;
};