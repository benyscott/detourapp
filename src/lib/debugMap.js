/**
 * Enable with NEXT_PUBLIC_DEBUG_MAP=1, or automatically in development.
 */
export const isMapDebugEnabled = () =>
    typeof process !== 'undefined' &&
    (process.env.NEXT_PUBLIC_DEBUG_MAP === '1' || process.env.NODE_ENV === 'development');

export const debugMap = (...args) => {
    if (isMapDebugEnabled()) {
        console.log('[Detour:Map]', ...args);
    }
};
