import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, Calendar } from 'lucide-react';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const parseDate = (val) => {
    if (!val) return null;
    const d = new Date(val + 'T00:00:00');
    return isNaN(d) ? null : d;
};

const fmt = (d) => {
    if (!d) return '';
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const fmtDisplay = (d) => {
    if (!d) return '';
    return `${String(d.getDate()).padStart(2, '0')} ${MONTHS[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`;
};

const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
const getFirstDayOfMonth = (y, m) => new Date(y, m, 1).getDay();

const DatePicker = ({
    value = '',
    onChange,
    placeholder = 'Select date',
    disabled = false,
    error = false,
    minDate,
    maxDate,
}) => {
    const today = new Date();
    const selected = parseDate(value);
    const [open, setOpen] = useState(false);
    const [view, setView] = useState('days');   // 'days' | 'months' | 'years'
    const [cursor, setCursor] = useState(() => selected || new Date(today.getFullYear() - 20, today.getMonth(), 1));
    const [flipUp, setFlipUp] = useState(false);
    const containerRef = useRef(null);

    const cy = cursor.getFullYear();
    const cm = cursor.getMonth();

    // Year range for year picker (current decade ± 5)
    const yearStart = Math.floor(cy / 12) * 12 - 1;
    const years = Array.from({ length: 16 }, (_, i) => yearStart + i);

    // Close on outside click
    useEffect(() => {
        if (!open) return;
        const h = (e) => { if (containerRef.current && !containerRef.current.contains(e.target)) { setOpen(false); setView('days'); } };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, [open]);

    useEffect(() => {
        if (!open) return;
        const h = (e) => { if (e.key === 'Escape') { setOpen(false); setView('days'); } };
        document.addEventListener('keydown', h);
        return () => document.removeEventListener('keydown', h);
    }, [open]);

    const handleOpen = () => {
        if (disabled) return;
        if (!open && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            setFlipUp(window.innerHeight - rect.bottom < 320 && rect.top > 320);
        }
        if (selected) setCursor(new Date(selected.getFullYear(), selected.getMonth(), 1));
        setOpen(p => !p);
        setView('days');
    };

    const selectDay = (day) => {
        const d = new Date(cy, cm, day);
        onChange?.({ target: { value: fmt(d) } });
        setOpen(false);
        setView('days');
    };

    const isDisabled = (day) => {
        const d = new Date(cy, cm, day);
        if (minDate && d < parseDate(minDate)) return true;
        if (maxDate && d > parseDate(maxDate)) return true;
        return false;
    };

    const isToday = (day) => {
        const d = new Date(cy, cm, day);
        return d.toDateString() === today.toDateString();
    };

    const isSelected = (day) => {
        if (!selected) return false;
        return new Date(cy, cm, day).toDateString() === selected.toDateString();
    };

    // Build calendar grid
    const daysInMonth = getDaysInMonth(cy, cm);
    const firstDay = getFirstDayOfMonth(cy, cm);
    const prevDays = getDaysInMonth(cy, cm - 1);
    const cells = [];

    // Leading empty cells from prev month
    for (let i = firstDay - 1; i >= 0; i--) cells.push({ day: prevDays - i, current: false });
    // Current month days
    for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, current: true });
    // Trailing cells
    const trailing = 42 - cells.length;
    for (let d = 1; d <= trailing; d++) cells.push({ day: d, current: false });

    const navBtn = (onClick, icon) => (
        <button type="button" onClick={onClick} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 28, height: 28, borderRadius: 7, border: 'none',
            background: 'none', cursor: 'pointer', color: 'var(--color-text-muted)',
            transition: 'background 0.12s, color 0.12s',
        }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-bg-secondary)'; e.currentTarget.style.color = 'var(--color-text)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--color-text-muted)'; }}
        >{icon}</button>
    );

    return (
        <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>

            {/* ── Trigger ── */}
            <button
                type="button"
                onClick={handleOpen}
                disabled={disabled}
                style={{
                    width: '100%',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    gap: 8, padding: '9px 13px',
                    background: disabled ? 'var(--color-bg-secondary)' : 'var(--color-surface)',
                    border: `1.5px solid ${error ? 'var(--color-danger)' : open ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    borderRadius: 'var(--radius-md)',
                    color: selected ? 'var(--color-text)' : 'var(--color-text-subtle)',
                    fontSize: 14, fontFamily: 'Inter, sans-serif',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    textAlign: 'left',
                    boxShadow: open ? (error ? '0 0 0 3px var(--color-danger-light)' : '0 0 0 3px var(--color-primary-light)') : 'none',
                    transition: 'border-color 0.15s, box-shadow 0.15s',
                    opacity: disabled ? 0.6 : 1,
                }}
            >
                <span style={{ flex: 1 }}>{selected ? fmtDisplay(selected) : placeholder}</span>
                <Calendar size={15} style={{ flexShrink: 0, color: 'var(--color-text-muted)' }} />
            </button>

            {/* ── Dropdown ── */}
            {open && (
                <div style={{
                    position: 'absolute',
                    [flipUp ? 'bottom' : 'top']: 'calc(100% + 6px)',
                    left: 0,
                    width: 300,
                    background: 'var(--color-surface-elevated)',
                    border: '1.5px solid var(--color-border)',
                    borderRadius: 14,
                    boxShadow: 'var(--shadow-xl)',
                    zIndex: 9999,
                    overflow: 'hidden',
                    animation: 'scaleIn 0.15s ease',
                    transformOrigin: flipUp ? 'bottom left' : 'top left',
                }}>

                    {/* ── Header ── */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px 10px', borderBottom: '1px solid var(--color-border-subtle)' }}>
                        {navBtn(() => { if (view === 'years') setCursor(new Date(cy - 16, cm, 1)); else if (view === 'months') setCursor(new Date(cy - 1, cm, 1)); else setCursor(new Date(cy, cm - 1, 1)); }, <ChevronLeft size={15} />)}

                        <div style={{ display: 'flex', gap: 4 }}>
                            {view !== 'months' && view !== 'years' && (
                                <button type="button" onClick={() => setView('months')} style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '4px 8px', borderRadius: 6, border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--color-text)', fontFamily: 'Poppins, sans-serif', transition: 'background 0.12s' }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg-secondary)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                                >
                                    {MONTHS[cm]} <ChevronDown size={12} style={{ color: 'var(--color-text-muted)' }} />
                                </button>
                            )}
                            <button type="button" onClick={() => setView(view === 'years' ? 'days' : 'years')} style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '4px 8px', borderRadius: 6, border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--color-text)', fontFamily: 'Poppins, sans-serif', transition: 'background 0.12s' }}
                                onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg-secondary)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'none'}
                            >
                                {view === 'years' ? `${yearStart} – ${yearStart + 15}` : cy} <ChevronDown size={12} style={{ color: 'var(--color-text-muted)', transform: view === 'years' ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                            </button>
                        </div>

                        {navBtn(() => { if (view === 'years') setCursor(new Date(cy + 16, cm, 1)); else if (view === 'months') setCursor(new Date(cy + 1, cm, 1)); else setCursor(new Date(cy, cm + 1, 1)); }, <ChevronRight size={15} />)}
                    </div>

                    {/* ── Year picker ── */}
                    {view === 'years' && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4, padding: 12 }}>
                            {years.map(y => {
                                const isCurrentYear = y === cy;
                                const isSel = selected && selected.getFullYear() === y;
                                return (
                                    <button key={y} type="button"
                                        onClick={() => { setCursor(new Date(y, cm, 1)); setView('months'); }}
                                        style={{
                                            padding: '7px 4px', borderRadius: 8, border: 'none',
                                            background: isSel ? 'var(--color-primary)' : isCurrentYear ? 'var(--color-primary-light)' : 'none',
                                            color: isSel ? '#fff' : isCurrentYear ? 'var(--color-primary)' : 'var(--color-text)',
                                            fontSize: 13, fontWeight: isSel || isCurrentYear ? 600 : 400,
                                            cursor: 'pointer', transition: 'background 0.12s',
                                        }}
                                        onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = 'var(--color-bg-secondary)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = isSel ? 'var(--color-primary)' : isCurrentYear ? 'var(--color-primary-light)' : 'none'; }}
                                    >{y}</button>
                                );
                            })}
                        </div>
                    )}

                    {/* ── Month picker ── */}
                    {view === 'months' && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4, padding: 12 }}>
                            {MONTHS.map((month, i) => {
                                const isSel = selected && selected.getFullYear() === cy && selected.getMonth() === i;
                                const isCur = today.getFullYear() === cy && today.getMonth() === i;
                                return (
                                    <button key={month} type="button"
                                        onClick={() => { setCursor(new Date(cy, i, 1)); setView('days'); }}
                                        style={{
                                            padding: '9px 4px', borderRadius: 8, border: 'none',
                                            background: isSel ? 'var(--color-primary)' : isCur ? 'var(--color-primary-light)' : 'none',
                                            color: isSel ? '#fff' : isCur ? 'var(--color-primary)' : 'var(--color-text)',
                                            fontSize: 13, fontWeight: isSel || isCur ? 600 : 400,
                                            cursor: 'pointer', transition: 'background 0.12s',
                                        }}
                                        onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = 'var(--color-bg-secondary)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = isSel ? 'var(--color-primary)' : isCur ? 'var(--color-primary-light)' : 'none'; }}
                                    >{month.slice(0, 3)}</button>
                                );
                            })}
                        </div>
                    )}

                    {/* ── Day grid ── */}
                    {view === 'days' && (
                        <div style={{ padding: '10px 12px 14px' }}>
                            {/* Weekday headers */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 6 }}>
                                {DAYS.map(d => (
                                    <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', padding: '4px 0', letterSpacing: '0.04em' }}>{d}</div>
                                ))}
                            </div>

                            {/* Day cells */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
                                {cells.map((cell, i) => {
                                    const dis = !cell.current || isDisabled(cell.day);
                                    const sel = cell.current && isSelected(cell.day);
                                    const tod = cell.current && isToday(cell.day);
                                    return (
                                        <button
                                            key={i}
                                            type="button"
                                            disabled={dis}
                                            onClick={() => cell.current && !dis && selectDay(cell.day)}
                                            style={{
                                                height: 34,
                                                borderRadius: 8,
                                                border: tod && !sel ? '1.5px solid var(--color-primary)' : 'none',
                                                background: sel ? 'var(--color-primary)' : 'none',
                                                color: sel ? '#fff' : !cell.current ? 'var(--color-text-subtle)' : tod ? 'var(--color-primary)' : 'var(--color-text)',
                                                fontSize: 13,
                                                fontWeight: sel || tod ? 700 : 400,
                                                cursor: dis ? 'default' : 'pointer',
                                                opacity: !cell.current ? 0.35 : 1,
                                                transition: 'background 0.12s, color 0.12s',
                                            }}
                                            onMouseEnter={e => { if (!dis && !sel) { e.currentTarget.style.background = 'var(--color-bg-secondary)'; } }}
                                            onMouseLeave={e => { e.currentTarget.style.background = sel ? 'var(--color-primary)' : 'none'; }}
                                        >
                                            {cell.day}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* ── Footer ── */}
                    {view === 'days' && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 14px 12px', borderTop: '1px solid var(--color-border-subtle)' }}>
                            <button type="button" onClick={() => { onChange?.({ target: { value: '' } }); setOpen(false); }}
                                style={{ fontSize: 12, color: 'var(--color-text-muted)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Inter,sans-serif', padding: '2px 6px', borderRadius: 4, transition: 'color 0.12s' }}
                                onMouseEnter={e => e.currentTarget.style.color = 'var(--color-danger)'}
                                onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-muted)'}
                            >Clear</button>
                            <button type="button" onClick={() => { selectDay(today.getDate()); setCursor(new Date(today.getFullYear(), today.getMonth(), 1)); }}
                                style={{ fontSize: 12, color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Inter,sans-serif', fontWeight: 600, padding: '2px 6px', borderRadius: 4, transition: 'background 0.12s' }}
                                A onMouseEnter={e => e.currentTarget.style.background = 'var(--color-primary-light)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'none'}
                            >Today</button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default DatePicker;