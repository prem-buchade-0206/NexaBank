import { useState, useMemo, useCallback } from 'react';
import useDebounce from './useDebounce';

const useSearch = (data = [], searchKeys = [], debounceMs = 350) => {
  const [query,   setQuery]   = useState('');
  const [filters, setFilters] = useState({});
  const [sortBy,  setSortBy]  = useState(null);
  const [sortDir, setSortDir] = useState('asc');

  const debouncedQuery = useDebounce(query, debounceMs);

  const results = useMemo(() => {
    let items = [...data];

    // Text search
    if (debouncedQuery.trim()) {
      const q = debouncedQuery.toLowerCase();
      items = items.filter(item =>
        searchKeys.some(key => {
          const val = key.split('.').reduce((o, k) => o?.[k], item);
          return String(val ?? '').toLowerCase().includes(q);
        })
      );
    }

    // Filters
    Object.entries(filters).forEach(([key, val]) => {
      if (val === '' || val === null || val === undefined) return;
      items = items.filter(item => {
        const v = key.split('.').reduce((o, k) => o?.[k], item);
        return String(v).toLowerCase() === String(val).toLowerCase();
      });
    });

    // Sort
    if (sortBy) {
      items.sort((a, b) => {
        const av = sortBy.split('.').reduce((o, k) => o?.[k], a) ?? '';
        const bv = sortBy.split('.').reduce((o, k) => o?.[k], b) ?? '';
        const cmp = typeof av === 'number'
          ? av - bv
          : String(av).localeCompare(String(bv));
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }

    return items;
  }, [data, debouncedQuery, filters, sortBy, sortDir, searchKeys]);

  const handleSort = useCallback((key) => {
    setSortDir(prev => (sortBy === key && prev === 'asc') ? 'desc' : 'asc');
    setSortBy(key);
  }, [sortBy]);

  const setFilter = useCallback((key, val) => {
    setFilters(prev => ({ ...prev, [key]: val }));
  }, []);

  const clearFilter = useCallback((key) => {
    setFilters(prev => { const n = { ...prev }; delete n[key]; return n; });
  }, []);

  const clearAll = useCallback(() => {
    setQuery('');
    setFilters({});
    setSortBy(null);
    setSortDir('asc');
  }, []);

  return {
    query,
    setQuery,
    debouncedQuery,
    filters,
    setFilter,
    clearFilter,
    sortBy,
    sortDir,
    handleSort,
    results,
    clearAll,
    hasActiveFilters: !!debouncedQuery || Object.keys(filters).length > 0,
    resultCount: results.length,
  };
};

export default useSearch;
