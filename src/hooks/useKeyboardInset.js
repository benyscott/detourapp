import { useEffect, useState } from 'react';

/** Below this, a visual-viewport change is Safari's toolbar resizing, not the keyboard */
const MIN_KEYBOARD_PX = 120;

/**
 * Height (px) of the on-screen keyboard, or 0 when it's closed.
 *
 * iOS Safari doesn't shrink the layout when the keyboard opens: `position: fixed; bottom: 0`
 * stays behind the keyboard, and Safari scrolls the whole page up to reveal the focused input.
 * We read the visual viewport instead, lift the bottom bar by the keyboard height, and undo
 * Safari's page scroll so the zen view stays put.
 */
export default function useKeyboardInset() {
    const [inset, setInset] = useState(0);

    useEffect(() => {
        const viewport = typeof window !== 'undefined' ? window.visualViewport : null;
        if (!viewport) {
            return undefined;
        }

        const update = () => {
            const covered = Math.round(window.innerHeight - viewport.height - viewport.offsetTop);
            const keyboardOpen = covered > MIN_KEYBOARD_PX;
            setInset(keyboardOpen ? covered : 0);

            if (keyboardOpen && (window.scrollY !== 0 || viewport.offsetTop !== 0)) {
                window.scrollTo(0, 0);
            }
        };

        viewport.addEventListener('resize', update);
        viewport.addEventListener('scroll', update);
        return () => {
            viewport.removeEventListener('resize', update);
            viewport.removeEventListener('scroll', update);
        };
    }, []);

    return inset;
}
