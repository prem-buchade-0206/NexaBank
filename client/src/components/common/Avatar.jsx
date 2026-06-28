import { getInitials } from '../../utils';
import { cn } from '../../utils';

const AVATAR_COLORS = [
  { bg: '#dbeafe', color: '#1e40af' },
  { bg: '#d1fae5', color: '#065f46' },
  { bg: '#ede9fe', color: '#5b21b6' },
  { bg: '#fce7f3', color: '#9d174d' },
  { bg: '#fef3c7', color: '#92400e' },
  { bg: '#fee2e2', color: '#991b1b' },
];

const getColor = (name = '') => {
  const code = name.charCodeAt(0) || 0;
  return AVATAR_COLORS[code % AVATAR_COLORS.length];
};

const Avatar = ({ name = '', src, size = 'md', className = '' }) => {
  const color = getColor(name);
  return (
    <span
      className={cn('avatar', `avatar-${size}`, className)}
      style={{ background: color.bg, color: color.color }}
    >
      {src
        ? <img src={src} alt={name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
        : getInitials(name)
      }
    </span>
  );
};

export default Avatar;
