import { Search, X } from 'lucide-react';

const SearchBar = ({
  value,
  onChange,
  placeholder = 'Search…',
  onClear,
  className = '',
  style = {},
}) => (
  <div className={`search-bar ${className}`} style={{ ...style }}>
    <Search size={16} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      autoComplete="off"
    />
    {value && (
      <button
        type="button"
        onClick={onClear || (() => onChange(''))}
        style={{
          display: 'flex',
          alignItems: 'center',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--color-text-muted)',
          padding: 2,
          borderRadius: 4,
          flexShrink: 0,
        }}
      >
        <X size={14} />
      </button>
    )}
  </div>
);

export default SearchBar;
