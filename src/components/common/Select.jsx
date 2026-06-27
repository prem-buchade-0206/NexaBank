import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, Check } from 'lucide-react';

/**
 * Custom Select — replaces native <select> everywhere.
 * Syncs with theme via CSS vars. Portal-free (uses absolute
 * positioning with smart flip-up when near bottom of viewport).
 *
 * Props mirror native <select>:
 *   value, onChange, options, placeholder, disabled, error, className
 *
 * options: [{ value, label, group? }]  or  ['string', ...]
 */
const Select = ({
    value = '',
    onChange,
    options = [],
    placeholder = 'Select…',
    disabled = false,
    error = false,
    className = '',
    style = {},
}) => {
    const [open, setOpen] = useState(false);
    const [flipUp, setFlipUp] = useState(false);
    const containerRef = useRef(null);
    const listRef = useRef(null);

    // Normalize options to { value, label } objects
    const normalized = options.map(o =>
        typeof o === 'string' ? { value: o, label: o } : o
    );

    const selected = normalized.find(o => o.value === value);

    // Close on outside click
    useEffect(() => {
        if (!open) return;
        const handler = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    // Close on Escape
    useEffect(() => {
        if (!open) return;
        const handler = (e) => { if (e.key === 'Escape') setOpen(false); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [open]);

    // Determine if dropdown should flip upward
    const handleOpen = useCallback(() => {
        if (disabled) return;
        if (!open && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            const spaceAbove = rect.top;
            const dropHeight = Math.min(normalized.length * 40 + 16, 260);
            setFlipUp(spaceBelow < dropHeight && spaceAbove > spaceBelow);
        }
        setOpen(p => !p);
    }, [disabled, open, normalized.length]);

    const handleSelect = useCallback((val) => {
        onChange?.({ target: { value: val } });
        setOpen(false);
    }, [onChange]);

    // Keyboard navigation
    const handleKeyDown = (e) => {
        if (disabled) return;
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleOpen(); }
        if (!open) return;
        const idx = normalized.findIndex(o => o.value === value);
        if (e.key === 'ArrowDown') { e.preventDefault(); handleSelect(normalized[Math.min(idx + 1, normalized.length - 1)]?.value); }
        if (e.key === 'ArrowUp') { e.preventDefault(); handleSelect(normalized[Math.max(idx - 1, 0)]?.value); }
    };

    return (
        <div
            ref={containerRef}
            style={{ position: 'relative', width: '100%', ...style }}
            className={className}
        >
            {/* Trigger */}
            <button
                type="button"
                onClick={handleOpen}
                onKeyDown={handleKeyDown}
                disabled={disabled}
                aria-haspopup="listbox"
                aria-expanded={open}
                style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                    padding: '9px 13px',
                    background: disabled ? 'var(--color-bg-secondary)' : 'var(--color-surface)',
                    border: `1.5px solid ${error ? 'var(--color-danger)' : open ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    borderRadius: 'var(--radius-md)',
                    color: selected ? 'var(--color-text)' : 'var(--color-text-subtle)',
                    fontSize: 14,
                    fontFamily: 'Inter, sans-serif',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    textAlign: 'left',
                    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                    boxShadow: open
                        ? error
                            ? '0 0 0 3px var(--color-danger-light)'
                            : '0 0 0 3px var(--color-primary-light)'
                        : 'none',
                    opacity: disabled ? 0.6 : 1,
                }}
            >
                <span style={{
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                }}>
                    {selected ? selected.label : placeholder}
                </span>
                <ChevronDown
                    size={15}
                    style={{
                        flexShrink: 0,
                        color: 'var(--color-text-muted)',
                        transition: 'transform 0.2s ease',
                        transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
                    }}
                />
            </button>

            {/* Dropdown list */}
            {open && (
                <div
                    ref={listRef}
                    role="listbox"
                    style={{
                        position: 'absolute',
                        [flipUp ? 'bottom' : 'top']: 'calc(100% + 6px)',
                        left: 0,
                        right: 0,
                        background: 'var(--color-surface-elevated)',
                        border: '1.5px solid var(--color-border)',
                        borderRadius: 'var(--radius-lg)',
                        boxShadow: 'var(--shadow-xl)',
                        zIndex: 9999,
                        overflow: 'hidden',
                        animation: 'scaleIn 0.15s ease',
                        transformOrigin: flipUp ? 'bottom center' : 'top center',
                        maxHeight: 260,
                        overflowY: 'auto',
                        scrollbarWidth: 'thin',
                        scrollbarColor: 'var(--scrollbar-thumb) transparent',
                    }}
                >
                    {/* Empty placeholder option */}
                    {placeholder && (
                        <div
                            role="option"
                            aria-selected={value === ''}
                            onClick={() => handleSelect('')}
                            style={{
                                padding: '9px 14px',
                                fontSize: 13.5,
                                color: 'var(--color-text-subtle)',
                                cursor: 'pointer',
                                borderBottom: '1px solid var(--color-border-subtle)',
                                fontStyle: 'italic',
                                transition: 'background 0.1s ease',
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg-secondary)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                            {placeholder}
                        </div>
                    )}

                    {normalized.map((opt) => {
                        const isSelected = opt.value === value;
                        return (
                            <div
                                key={opt.value}
                                role="option"
                                aria-selected={isSelected}
                                onClick={() => handleSelect(opt.value)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '10px 14px',
                                    fontSize: 13.5,
                                    fontFamily: 'Inter, sans-serif',
                                    color: isSelected ? 'var(--color-primary)' : 'var(--color-text)',
                                    background: isSelected ? 'var(--color-primary-light)' : 'transparent',
                                    cursor: 'pointer',
                                    fontWeight: isSelected ? 600 : 400,
                                    transition: 'background 0.1s ease',
                                }}
                                onMouseEnter={e => {
                                    if (!isSelected) e.currentTarget.style.background = 'var(--color-bg-secondary)';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.background = isSelected ? 'var(--color-primary-light)' : 'transparent';
                                }}
                            >
                                <span>{opt.label}</span>
                                {isSelected && (
                                    <Check size={14} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default Select;