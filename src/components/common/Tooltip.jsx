import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

/**
 * Tooltip — portal-based, theme-aware, placement-accurate
 *
 * FIX 1: triggerRef attached directly to a real <span> wrapper
 *         (not display:contents) so getBoundingClientRect() is reliable
 * FIX 2: hardcoded dark/light colors that always contrast correctly,
 *         reading the active data-theme from <html>
 */

const TOOLTIP_COLORS = {
    light: { bg: '#3d3a35', text: '#f8f7f5', arrow: '#3d3a35' },
    dark: { bg: '#e2e8f0', text: '#0f172a', arrow: '#e2e8f0' },
};

const getTheme = () =>
    document.documentElement.getAttribute('data-theme') || 'light';

const Tooltip = ({
    content,
    placement = 'top',
    delay = 120,
    disabled = false,
    children,
}) => {
    const [visible, setVisible] = useState(false);
    const [coords, setCoords] = useState({ x: 0, y: 0 });
    const [ready, setReady] = useState(false);
    const [theme, setTheme] = useState(getTheme);

    const wrapRef = useRef(null);   // real DOM span — always measurable
    const tooltipRef = useRef(null);
    const showTimer = useRef(null);
    const hideTimer = useRef(null);

    // Keep theme in sync with data-theme changes
    useEffect(() => {
        const observer = new MutationObserver(() => setTheme(getTheme()));
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
        return () => observer.disconnect();
    }, []);

    const calculatePosition = useCallback(() => {
        const wrap = wrapRef.current;
        const tip = tooltipRef.current;
        if (!wrap || !tip) return;

        const tr = wrap.getBoundingClientRect();   // real span — always correct
        const tw = tip.offsetWidth;
        const th = tip.offsetHeight;
        const gap = 10;

        let x = 0, y = 0;

        switch (placement) {
            case 'right':
                x = tr.right + gap;
                y = tr.top + tr.height / 2 - th / 2;
                break;
            case 'left':
                x = tr.left - tw - gap;
                y = tr.top + tr.height / 2 - th / 2;
                break;
            case 'bottom':
                x = tr.left + tr.width / 2 - tw / 2;
                y = tr.bottom + gap;
                break;
            case 'top':
            default:
                x = tr.left + tr.width / 2 - tw / 2;
                y = tr.top - th - gap;
                break;
        }

        // Clamp inside viewport with 8px margin
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        x = Math.max(8, Math.min(x, vw - tw - 8));
        y = Math.max(8, Math.min(y, vh - th - 8));

        setCoords({ x, y });
        setReady(true);
    }, [placement]);

    const show = useCallback(() => {
        clearTimeout(hideTimer.current);
        showTimer.current = setTimeout(() => {
            setVisible(true);
            // Two rAFs: first lets React render, second lets browser paint & measure
            requestAnimationFrame(() => requestAnimationFrame(calculatePosition));
        }, delay);
    }, [delay, calculatePosition]);

    const hide = useCallback(() => {
        clearTimeout(showTimer.current);
        hideTimer.current = setTimeout(() => {
            setVisible(false);
            setReady(false);
        }, 80);
    }, []);

    useEffect(() => () => {
        clearTimeout(showTimer.current);
        clearTimeout(hideTimer.current);
    }, []);

    useEffect(() => {
        if (!visible) return;
        const update = () => calculatePosition();
        window.addEventListener('scroll', update, true);
        window.addEventListener('resize', update);
        return () => {
            window.removeEventListener('scroll', update, true);
            window.removeEventListener('resize', update);
        };
    }, [visible, calculatePosition]);

    if (!content || disabled) return children;

    // Pick correct colors for current theme
    const colors = TOOLTIP_COLORS[theme] || TOOLTIP_COLORS.light;

    // Arrow position + direction per placement
    const arrowStyles = {
        top: {
            bottom: -5,
            left: '50%',
            transform: 'translateX(-50%) rotate(45deg)',
        },
        bottom: {
            top: -5,
            left: '50%',
            transform: 'translateX(-50%) rotate(45deg)',
        },
        right: {
            left: -5,
            top: '50%',
            transform: 'translateY(-50%) rotate(45deg)',
        },
        left: {
            right: -5,
            top: '50%',
            transform: 'translateY(-50%) rotate(45deg)',
        },
    }[placement];

    const tooltipEl = visible && (
        <div
            ref={tooltipRef}
            role="tooltip"
            style={{
                position: 'fixed',
                left: coords.x,
                top: coords.y,
                zIndex: 99999,
                pointerEvents: 'none',
                visibility: ready ? 'visible' : 'hidden',
                opacity: ready ? 1 : 0,
                transform: ready ? 'scale(1) translateY(0)' : 'scale(0.9) translateY(4px)',
                transition: 'opacity 150ms cubic-bezier(0.4,0,0.2,1), transform 150ms cubic-bezier(0.4,0,0.2,1)',
                transformOrigin: {
                    top: 'bottom center',
                    bottom: 'top center',
                    left: 'right center',
                    right: 'left center',
                }[placement],
            }}
        >
            <div style={{
                position: 'relative',
                background: colors.bg,
                color: colors.text,
                fontSize: 12,
                fontWeight: 500,
                fontFamily: 'Inter, sans-serif',
                lineHeight: 1.5,
                padding: '6px 12px',
                borderRadius: 8,
                whiteSpace: 'nowrap',
                maxWidth: 280,
                boxShadow: '0 4px 16px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.08)',
                letterSpacing: '0.01em',
            }}>
                {content}

                {/* Arrow */}
                <span style={{
                    position: 'absolute',
                    width: 8,
                    height: 8,
                    background: colors.arrow,
                    borderRadius: 1,
                    ...arrowStyles,
                }} />
            </div>
        </div>
    );

    return (
        <>
            {/*
        Real inline-flex span — getBoundingClientRect() works reliably.
        NOT display:contents which breaks measurement in some browsers.
      */}
            <span
                ref={wrapRef}
                onMouseEnter={show}
                onMouseLeave={hide}
                onFocus={show}
                onBlur={hide}
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    // No extra size — inherits from child naturally
                }}
            >
                {children}
            </span>

            {tooltipEl && createPortal(tooltipEl, document.body)}
        </>
    );
};

export default Tooltip;