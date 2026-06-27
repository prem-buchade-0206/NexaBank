import { cn } from '../../utils';
import Tooltip from './Tooltip';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  loading = false,
  disabled = false,
  fullWidth = false,
  type = 'button',
  onClick,
  className = '',
  ...props
}) => {
  const sizeMap = { sm: 'btn-sm', md: '', lg: 'btn-lg' };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn('btn', `btn-${variant}`, sizeMap[size], fullWidth && 'w-full', className)}
      style={fullWidth ? { width: '100%' } : {}}
      {...props}
    >
      {loading ? (
        <>
          <span
            style={{
              width: 15, height: 15,
              border: '2px solid currentColor',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              display: 'inline-block',
              flexShrink: 0,
            }}
            className="animate-spin"
          />
          <span>Loading…</span>
        </>
      ) : (
        <>
          {icon && <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>{icon}</span>}
          {children}
          {iconRight && <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>{iconRight}</span>}
        </>
      )}
    </button>
  );
};

export const IconButton = ({ icon, variant = 'ghost', size = 'md', tooltip, tooltipPlacement = 'top', onClick, className = '', disabled }) => {
  const btn = (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn('btn', `btn-${variant}`, size === 'sm' ? 'btn-icon-sm' : 'btn-icon', className)}
    >
      {icon}
    </button>
  );

  if (!tooltip) return btn;

  return (
    <Tooltip content={tooltip} placement={tooltipPlacement}>
      {btn}
    </Tooltip>
  );
};

export default Button;