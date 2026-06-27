import { useEffect, useRef, useState } from 'react';

const Dropdown = ({ trigger, items = [], align = 'right' }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <div onClick={() => setOpen(p => !p)} style={{ cursor: 'pointer' }}>
        {trigger}
      </div>
      {open && (
        <div
          className="dropdown-menu"
          style={{
            [align === 'right' ? 'right' : 'left']: 0,
            top: 'calc(100% + 6px)',
          }}
        >
          {items.map((item, i) =>
            item.divider ? (
              <div key={i} className="divider" style={{ margin: '4px 0' }} />
            ) : (
              <div
                key={i}
                className={`dropdown-item${item.danger ? ' danger' : ''}`}
                onClick={() => { item.onClick?.(); setOpen(false); }}
              >
                {item.icon && <span style={{ display: 'flex', flexShrink: 0 }}>{item.icon}</span>}
                <span>{item.label}</span>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};

export default Dropdown;
