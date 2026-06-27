import { useState, useMemo, useCallback } from 'react';
import { DEFAULT_PAGE_SIZE } from '../constants';

const usePagination = (totalItems = 0, initialPageSize = DEFAULT_PAGE_SIZE) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize,    setPageSize]    = useState(initialPageSize);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalItems / pageSize)),
    [totalItems, pageSize]
  );

  const goToPage = useCallback((page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  }, [totalPages]);

  const nextPage = useCallback(() => goToPage(currentPage + 1), [currentPage, goToPage]);
  const prevPage = useCallback(() => goToPage(currentPage - 1), [currentPage, goToPage]);
  const firstPage = useCallback(() => goToPage(1), [goToPage]);
  const lastPage  = useCallback(() => goToPage(totalPages), [goToPage, totalPages]);

  const changePageSize = useCallback((size) => {
    setPageSize(size);
    setCurrentPage(1);
  }, []);

  const offset = (currentPage - 1) * pageSize;

  const pageNumbers = useMemo(() => {
    const delta = 2;
    const range = [];
    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) range.push(i);

    if (currentPage - delta > 2)         range.unshift('...');
    if (currentPage + delta < totalPages - 1) range.push('...');
    if (totalPages > 1) range.unshift(1);
    if (totalPages > 1) range.push(totalPages);

    return totalPages === 1 ? [1] : [...new Set(range)];
  }, [currentPage, totalPages]);

  const startItem = totalItems === 0 ? 0 : offset + 1;
  const endItem   = Math.min(offset + pageSize, totalItems);

  return {
    currentPage,
    pageSize,
    totalPages,
    offset,
    pageNumbers,
    startItem,
    endItem,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
    goToPage,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
    changePageSize,
  };
};

export default usePagination;
