import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * 모달·패널 상태를 URL 쿼리로 관리 (새로고침해도 같은 상태가 열림)
 * const [q, setQuery] = useQuery();
 * q.get('modal') / setQuery({ modal: 'upload' }) / setQuery({ modal: null })  ← null 은 지움
 * 기본은 기록을 남기고(push), { replace: true } 면 바꿔치기.
 */
export default function useQuery() {
  const [params, setParams] = useSearchParams();
  const setQuery = useCallback((patch, opts = {}) => {
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      Object.entries(patch).forEach(([k, v]) => {
        if (v === null || v === undefined || v === '') next.delete(k); else next.set(k, String(v));
      });
      return next;
    }, { replace: !!opts.replace });
  }, [setParams]);
  return [params, setQuery];
}
