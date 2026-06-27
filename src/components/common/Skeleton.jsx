import { cn } from '../../utils';

const Skeleton = ({ className = '', width, height, rounded = 'md', count = 1 }) => {
  const radiusMap = { sm: '6px', md: '10px', lg: '14px', full: '9999px' };
  const style = {
    width:  width  || '100%',
    height: height || '16px',
    borderRadius: radiusMap[rounded] || radiusMap.md,
    display: 'block',
    flexShrink: 0,
  };

  if (count > 1) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {Array.from({ length: count }).map((_, i) => (
          <span key={i} className={cn('skeleton', className)} style={style} />
        ))}
      </div>
    );
  }

  return <span className={cn('skeleton', className)} style={style} />;
};

export const SkeletonCard = ({ rows = 3 }) => (
  <div className="card" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
    <Skeleton height="20px" width="60%" />
    <Skeleton height="36px" width="40%" />
    <Skeleton height="14px" width="80%" />
  </div>
);

export const SkeletonTable = ({ rows = 5, cols = 5 }) => (
  <div className="table-container">
    <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)', display: 'flex', gap: '16px' }}>
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} height="14px" width={i === 0 ? '80px' : '120px'} />
      ))}
    </div>
    {Array.from({ length: rows }).map((_, r) => (
      <div key={r} style={{ padding: '14px 16px', borderBottom: '1px solid var(--color-border-subtle)', display: 'flex', gap: '16px', alignItems: 'center' }}>
        {Array.from({ length: cols }).map((_, c) => (
          <Skeleton key={c} height="14px" width={c === 0 ? '100px' : '140px'} />
        ))}
      </div>
    ))}
  </div>
);

export const SkeletonText = ({ lines = 3 }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton key={i} height="14px" width={i === lines - 1 ? '60%' : '100%'} />
    ))}
  </div>
);

export default Skeleton;
