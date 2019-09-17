/**
 * Function to turn props of components into css variables or values.
 */
function cssValue(...values) {
    return values.map(v => `var(--${v.replace(/[^a-zA-Z0-9-_]/g, '')}, ${v})`).join(' ');
}

export { cssValue }