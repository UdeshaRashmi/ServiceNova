import { useCallback, useEffect, useRef, useState } from 'react';
import { errorMessage } from '../services/api';

export function useResource<T>(loader: () => Promise<T>) {
  const [data, setData] = useState<T>();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const generation = useRef(0);
  const reload = useCallback(async () => {
    const current = ++generation.current;
    setLoading(true);
    setError('');
    try {
      const result = await loader();
      if (current === generation.current) setData(result);
    } catch (e) {
      if (current === generation.current) setError(errorMessage(e));
    } finally {
      if (current === generation.current) setLoading(false);
    }
  }, [loader]);
  useEffect(() => {
    void reload();
    return () => {
      generation.current++;
    };
  }, [reload]);
  return { data, error, loading, reload };
}
