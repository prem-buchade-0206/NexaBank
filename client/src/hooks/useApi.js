import { useState, useCallback, useRef } from 'react';

const useApi = () => {
  const [loading, setLoading]   = useState(false);
  const [error,   setError]     = useState(null);
  const [data,    setData]      = useState(null);
  const abortRef = useRef(null);

  const execute = useCallback(async (apiFn, ...args) => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      const result = await apiFn(...args);
      setData(result);
      return result;
    } catch (err) {
      if (err.name === 'AbortError') return;
      const message = err?.response?.data?.detail || err.message || 'Something went wrong';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setData(null);
  }, []);

  return { loading, error, data, execute, reset };
};

export default useApi;
