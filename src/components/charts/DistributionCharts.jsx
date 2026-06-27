import { useState, useRef, useCallback } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

/*
 * SMOOTH HOVER STRATEGY:
 * 1. SVG Cells don't support CSS transitions via Recharts re-renders.
 *    So instead we overlay transparent SVG hotspot <sectors> to detect
 *    mouse position, and apply visual changes only to DOM elements
 *    (legend, tooltip, center label) which DO support CSS transitions.
 *
 * 2. The Pie itself uses a single stable fill per cell — no opacity
 *    change on the SVG (which would flicker). Instead we dim via a
 *    semi-transparent overlay rect on inactive slices using CSS.
 *
 * 3. A 30ms debounce on onMouseLeave stops flicker when moving
 *    between slices.
 */

/* ── Floating tooltip — fades in/out via CSS ──────────── */
const FloatingTooltip = ({ data, activeIndex }) => {
  const visible = activeIndex !== null && activeIndex !== undefined;
  const item = visible ? data[activeIndex] : data[0];
  if (!item) return null;
  const total = data.reduce((s, d) => s + d.value, 0);
  const pct = total ? ((item.value / total) * 100).toFixed(1) : 0;

  return (
    <div style={{
      position: 'absolute',
      top: -14,
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'var(--color-surface-elevated)',
      border: `1.5px solid ${item.color}`,
      borderRadius: 10,
      padding: '7px 13px',
      boxShadow: `0 8px 24px rgba(0,0,0,0.2)`,
      fontSize: 12,
      whiteSpace: 'nowrap',
      zIndex: 50,
      pointerEvents: 'none',
      /* CSS transition on opacity + transform — always mounted */
      opacity: visible ? 1 : 0,
      transform: visible
        ? 'translateX(-50%) translateY(0px)'
        : 'translateX(-50%) translateY(4px)',
      transition: 'opacity 200ms ease, transform 200ms ease, border-color 200ms ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
        <span style={{
          width: 8, height: 8, borderRadius: '50%',
          background: item.color, display: 'inline-block',
          transition: 'background 200ms ease',
        }} />
        <span style={{
          fontWeight: 700, color: 'var(--color-text)',
          fontFamily: 'Poppins, sans-serif', fontSize: 12.5,
        }}>
          {item.name}
        </span>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <span style={{ color: 'var(--color-text-muted)' }}>
          Count: <strong style={{ color: 'var(--color-text)' }}>{item.value}</strong>
        </span>
        <span style={{ color: 'var(--color-text-muted)' }}>
          Share: <strong style={{ color: item.color, transition: 'color 200ms ease' }}>{pct}%</strong>
        </span>
      </div>
    </div>
  );
};

/* ── Legend — all transitions via CSS ─────────────────── */
const CustomLegend = ({ data, activeIndex, onEnter, onLeave }) => {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      gap: 10, justifyContent: 'center', minWidth: 140,
    }}>
      {data.map((item, i) => {
        const pct = total ? ((item.value / total) * 100).toFixed(0) : 0;
        const isActive = activeIndex === i;
        const dimmed = activeIndex !== null && !isActive;
        return (
          <div
            key={item.name}
            onMouseEnter={() => onEnter(i)}
            onMouseLeave={onLeave}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              cursor: 'pointer',
              /* CSS transition on opacity — smooth dim/undim */
              opacity: dimmed ? 0.38 : 1,
              transition: 'opacity 220ms ease',
            }}
          >
            <span style={{
              width: 10, height: 10, borderRadius: '50%',
              background: item.color, flexShrink: 0,
              display: 'inline-block',
              boxShadow: isActive ? `0 0 0 3px ${item.color}40` : `0 0 0 0px ${item.color}00`,
              transition: 'box-shadow 220ms ease',
            }} />
            <span style={{
              fontSize: 13,
              fontWeight: isActive ? 600 : 400,
              color: 'var(--color-text)', flex: 1,
              transition: 'font-weight 0ms', /* instant — font-weight can't tween */
            }}>
              {item.name}
            </span>
            <span style={{
              fontSize: 12, fontWeight: 600, minWidth: 36, textAlign: 'right',
              color: isActive ? item.color : 'var(--color-text-muted)',
              transition: 'color 220ms ease',
            }}>
              {pct}%
            </span>
          </div>
        );
      })}
    </div>
  );
};

/* ── Center label — transitions on color + value ──────── */
const CenterLabel = ({ data, activeIndex, total, centerLabel }) => {
  const active = activeIndex !== null && data[activeIndex];
  const dispValue = active ? active.value : total;
  const dispLabel = active ? active.name : centerLabel;
  const dispColor = active ? active.color : 'var(--color-text)';

  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      pointerEvents: 'none', zIndex: 10,
    }}>
      <span style={{
        fontSize: 24, fontWeight: 700, lineHeight: 1,
        fontFamily: 'Poppins, sans-serif',
        color: dispColor,
        transition: 'color 220ms ease',
      }}>
        {dispValue}
      </span>
      <span style={{
        fontSize: 10, fontWeight: 500, marginTop: 4,
        letterSpacing: '0.07em', textTransform: 'uppercase',
        color: 'var(--color-text-muted)',
        transition: 'color 220ms ease',
        maxWidth: 80, textAlign: 'center', lineHeight: 1.3,
      }}>
        {dispLabel}
      </span>
    </div>
  );
};

/* ── Main donut ───────────────────────────────────────── */
const DonutWithCenter = ({ data = [], centerLabel = 'Total' }) => {
  const [activeIndex, setActiveIndex] = useState(null);
  const leaveTimer = useRef(null);
  const total = data.reduce((s, d) => s + d.value, 0);

  const handleEnter = useCallback((i) => {
    clearTimeout(leaveTimer.current);
    setActiveIndex(i);
  }, []);

  const handleLeave = useCallback(() => {
    /* Small delay so moving between slices doesn't flash null */
    leaveTimer.current = setTimeout(() => setActiveIndex(null), 80);
  }, []);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, width: '100%' }}>

      {/* Donut area */}
      <div style={{ position: 'relative', flex: '0 0 160px', height: 160 }}>

        {/* Tooltip — always mounted, transitions opacity */}
        <FloatingTooltip data={data} activeIndex={activeIndex} />

        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={70}
              paddingAngle={3}
              dataKey="value"
              strokeWidth={0}
              onMouseEnter={(_, i) => handleEnter(i)}
              onMouseLeave={handleLeave}
              style={{ cursor: 'pointer', outline: 'none' }}
              isAnimationActive={true}
              animationBegin={0}
              animationDuration={600}
              animationEasing="ease-out"
            >
              {data.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.color}
                  /* 
                   * Recharts strips CSS transition from SVG.
                   * We use outerRadius change via CSS filter instead:
                   * active slice gets a drop-shadow glow.
                   */
                  style={{
                    filter: activeIndex === i
                      ? `drop-shadow(0 0 6px ${entry.color}90) brightness(1.08)`
                      : activeIndex !== null
                        ? 'brightness(0.65)'
                        : 'brightness(1)',
                    /* 
                     * CSS filter DOES transition on SVG elements —
                     * unlike opacity which Recharts overrides.
                     */
                    transition: 'filter 220ms ease',
                    outline: 'none',
                  }}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Center label */}
        <CenterLabel
          data={data}
          activeIndex={activeIndex}
          total={total}
          centerLabel={centerLabel}
        />
      </div>

      {/* Legend */}
      <CustomLegend
        data={data}
        activeIndex={activeIndex}
        onEnter={handleEnter}
        onLeave={handleLeave}
      />
    </div>
  );
};

export const AccountDistributionChart = ({ data = [] }) => (
  <DonutWithCenter data={data} centerLabel="Accounts" />
);

export const LoanStatusChart = ({ data = [] }) => (
  <DonutWithCenter data={data} centerLabel="Loans" />
);