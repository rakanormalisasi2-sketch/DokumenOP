import { useState, useCallback, useEffect, useRef } from 'react';

export interface UseMiniToolbarReturn {
    isOpen: boolean;
    position: { x: number; y: number } | null;
    openToolbar: (rect: DOMRect) => void;
    closeToolbar: () => void;
}

export function useMiniToolbar(enabled = true): UseMiniToolbarReturn {
    const [isOpen, setIsOpen] = useState(false);
    const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
    const timeoutRef = useRef<any>(null);

    const openToolbar = useCallback((rect: DOMRect) => {
        if (!enabled) return;

        // Clear any pending closes
        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        // If the selection has a valid size
        if (rect.width > 2 || rect.height > 2) {
            setPosition({
                x: rect.left + rect.width / 2 - 100, // Roughly center
                y: rect.top,
            });
            // Debounce the opening so typing doesn't flash it
            timeoutRef.current = setTimeout(() => {
                setIsOpen(true);
            }, 300);
        } else {
            setIsOpen(false);
            setPosition(null);
        }
    }, [enabled]);

    const closeToolbar = useCallback(() => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setIsOpen(false);
        setPosition(null);
    }, []);

    // Listen to mouse clicks & keys globally to close
    useEffect(() => {
        if (!isOpen && !enabled) return;

        const handleGlobalMouseDown = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (target.closest('.docx-mini-toolbar')) return;
            closeToolbar();
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') closeToolbar();
            if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Delete') {
                closeToolbar();
            }
        };

        document.addEventListener('mousedown', handleGlobalMouseDown);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('mousedown', handleGlobalMouseDown);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, enabled, closeToolbar]);

    return {
        isOpen,
        position,
        openToolbar,
        closeToolbar,
    };
}
