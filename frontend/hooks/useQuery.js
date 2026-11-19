/* 모달·패널 상태를 URL 쿼리로 관리하는 훅 (새로고침해도 같은 상태가 열림) */
import { useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

/**
 * const [q, setQuery] = useQuery();
 * q.get('modal') / setQuery({ modal: 'upload' }) / setQuery({ modal: null })  ← null 은 지움
 * 기본은 기록을 남기고(push), { replace: true } 면 바꿔치기. 스크롤 위치는 그대로 둔다.
 */
export default function useQuery() {
  const params = useSearchParams();
  const router = useRouter();
  const setQuery = useCallback((patch, opts = {}) => {
    // 같은 이벤트에서 여러 번 불러도 최신 주소를 기준으로 고치도록 지금 주소에서 읽는다
    const next = new URLSearchParams(window.location.search);
    Object.entries(patch).forEach(([k, v]) => {
      if (v === null || v === undefined || v === '') next.delete(k); else next.set(k, String(v));
    });
    const qs = next.toString();
    const url = `${window.location.pathname}${qs ? `?${qs}` : ''}`;
    if (opts.replace) router.replace(url, { scroll: false });
    else router.push(url, { scroll: false });
  }, [router]);
  return [params, setQuery];
}
