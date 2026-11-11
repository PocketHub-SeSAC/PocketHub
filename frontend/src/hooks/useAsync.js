import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * 비동기 불러오기 + 로딩/오류 상태.
 * const { data, loading, error, reload, setData } = useAsync(() => getFiles(teamId), [teamId]);
 * fn 이 null 이면 불러오지 않는다.
 */
export default function useAsync(fn, deps) {
  const [state, setState] = useState({ data: undefined, loading: !!fn, error: null });
  const seq = useRef(0);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const run = useCallback((silent = false) => {
    const f = fnRef.current;
    if (!f) { setState({ data: undefined, loading: false, error: null }); return Promise.resolve(); }
    const my = ++seq.current;
    if (!silent) setState({ data: undefined, loading: true, error: null });
    return f().then(
      (data) => { if (my === seq.current) setState({ data, loading: false, error: null }); },
      (error) => { if (my === seq.current) setState((s) => ({ data: silent ? s.data : undefined, loading: false, error })); },
    );
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { run(); }, deps);

  const setData = useCallback((upd) => setState((s) => ({ ...s, data: typeof upd === 'function' ? upd(s.data) : upd })), []);
  /** reload(true) = 로딩 표시 없이 조용히 새로 받기 */
  return { ...state, reload: run, setData };
}
