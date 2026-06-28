import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { PAGE_SIZE_OPTIONS } from '../../constants';
import Tooltip from './Tooltip';

const Pagination = ({
  currentPage,
  totalPages,
  pageNumbers,
  hasNextPage,
  hasPrevPage,
  startItem,
  endItem,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  showPageSize = true,
}) => {
  if (totalPages <= 1 && !showPageSize) return null;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 16px',
      borderTop: '1px solid var(--color-border)',
      flexWrap: 'wrap',
      gap: 12,
    }}>
      <div style={{ fontSize: 13, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 12 }}>
        <span>
          {totalItems === 0 ? 'No results' : `${startItem}–${endItem} of ${totalItems}`}
        </span>
        {showPageSize && (
          <select
            value={pageSize}
            onChange={e => onPageSizeChange(Number(e.target.value))}
            style={{
              background: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              borderRadius: 6,
              padding: '3px 8px',
              fontSize: 13,
              color: 'var(--color-text)',
              cursor: 'pointer',
            }}
          >
            {PAGE_SIZE_OPTIONS.map(s => (
              <option key={s} value={s}>{s} / page</option>
            ))}
          </select>
        )}
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <Tooltip content="First page" placement="top">
            <button className="pagination-btn" onClick={() => onPageChange(1)} disabled={!hasPrevPage}>
              <ChevronsLeft size={14} />
            </button>
          </Tooltip>
          <Tooltip content="Previous page" placement="top">
            <button className="pagination-btn" onClick={() => onPageChange(currentPage - 1)} disabled={!hasPrevPage}>
              <ChevronLeft size={14} />
            </button>
          </Tooltip>

          {pageNumbers.map((num, i) =>
            num === '...' ? (
              <span key={`ellipsis-${i}`} style={{ padding: '0 4px', color: 'var(--color-text-muted)' }}>…</span>
            ) : (
              <button
                key={num}
                className={`pagination-btn${currentPage === num ? ' active' : ''}`}
                onClick={() => onPageChange(num)}
              >
                {num}
              </button>
            )
          )}

          <Tooltip content="Next page" placement="top">
            <button className="pagination-btn" onClick={() => onPageChange(currentPage + 1)} disabled={!hasNextPage}>
              <ChevronRight size={14} />
            </button>
          </Tooltip>
          <Tooltip content="Last page" placement="top">
            <button className="pagination-btn" onClick={() => onPageChange(totalPages)} disabled={!hasNextPage}>
              <ChevronsRight size={14} />
            </button>
          </Tooltip>
        </div>
      )}
    </div>
  );
};

export default Pagination;