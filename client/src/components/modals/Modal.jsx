import { useEffect, useCallback } from 'react';
import { X } from 'lucide-react';

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  footer,
  closeOnBackdrop = true,
}) => {
  const sizeMap = {
    sm: '420px',
    md: '560px',
    lg: '720px',
    xl: '940px',
    full: '95vw',
  };

  const handleKey = useCallback((e) => {
    if (e.key === 'Escape' && isOpen) onClose();
  }, [isOpen, onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  /*
   * CRITICAL FIX: Do NOT set body overflow:hidden.
   * The backdrop div IS the scroll container — locking the body
   * also locks the backdrop, making tall forms impossible to scroll.
   *
   * Instead we stop wheel/touch events from passing through to the
   * page only when the scroll has reached the backdrop edges.
   */
  useEffect(() => {
    if (!isOpen) return;

    const preventPageScroll = (e) => {
      // Allow scrolling inside the modal backdrop — block page behind it
      const backdrop = document.getElementById('modal-backdrop');
      if (backdrop && backdrop.contains(e.target)) return;
      e.preventDefault();
    };

    // Only block page scroll via keyboard (Page Down etc.) not wheel
    const handleKeyScroll = (e) => {
      const scrollKeys = ['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End'];
      if (scrollKeys.includes(e.key)) {
        const backdrop = document.getElementById('modal-backdrop');
        if (backdrop && !backdrop.contains(document.activeElement)) {
          e.preventDefault();
        }
      }
    };

    document.addEventListener('keydown', handleKeyScroll);
    return () => document.removeEventListener('keydown', handleKeyScroll);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    /*
     * BACKDROP — this is the scroll container.
     * overflow-y: auto here, NOT on body, NOT on the panel.
     * The panel grows to natural height; backdrop scrolls to show it all.
     */
    <div
      id="modal-backdrop"
      onClick={closeOnBackdrop ? (e) => { if (e.target === e.currentTarget) onClose(); } : undefined}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9000,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        /* ← THE FIX: backdrop scrolls, not the panel, not the body */
        overflowY: 'auto',
        overflowX: 'hidden',
        scrollBehavior: 'smooth',
        /* Center panel horizontally, start at top vertically so
           top of long forms is always visible */
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '48px 16px 48px',
        boxSizing: 'border-box',
      }}
    >
      {/* PANEL — no height cap, no overflow, grows naturally */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 20,
          boxShadow: '0 24px 64px rgba(0,0,0,0.3), 0 4px 16px rgba(0,0,0,0.15)',
          width: '100%',
          maxWidth: sizeMap[size] || sizeMap.md,
          /* Let content define height — NO max-height, NO overflow */
          flexShrink: 0,
          animation: 'scaleIn 0.2s cubic-bezier(0.34,1.2,0.64,1)',
        }}
      >
        {/* HEADER — sticky so always visible while scrolling backdrop */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px 24px 16px',
          borderBottom: '1px solid var(--color-border)',
          position: 'sticky',
          top: 0,
          /* Must match panel bg to cover content scrolling beneath */
          background: 'var(--color-surface)',
          borderRadius: '20px 20px 0 0',
          zIndex: 1,
        }}>
          {title && (
            <h2 style={{
              fontSize: 16,
              fontWeight: 700,
              color: 'var(--color-text)',
              fontFamily: 'Poppins, sans-serif',
              letterSpacing: '-0.01em',
              margin: 0,
            }}>
              {title}
            </h2>
          )}
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              marginLeft: 'auto',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--color-text-muted)',
              width: 32, height: 32, borderRadius: 8, flexShrink: 0,
              transition: 'background 0.15s, color 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--color-bg-secondary)';
              e.currentTarget.style.color = 'var(--color-text)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'none';
              e.currentTarget.style.color = 'var(--color-text-muted)';
            }}
          >
            <X size={17} />
          </button>
        </div>

        {/* BODY — plain padding, content determines height */}
        <div style={{ padding: '24px 24px 32px' }}>
          {children}
        </div>

        {/* FOOTER */}
        {footer && (
          <div style={{
            padding: '14px 24px 20px',
            borderTop: '1px solid var(--color-border)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 10,
            background: 'var(--color-surface)',
            borderRadius: '0 0 20px 20px',
          }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;