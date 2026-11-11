import { createContext, startTransition, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as authApi from '../api/auth';
import { getToken, setToken, clearToken } from '../api/token';

/* 로그인 상태. 시작할 때 토큰이 있으면 내 정보(API-002)로 확인한다 */
const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [state, setState] = useState({ ready: false, user: null, error: null });

  const refresh = useCallback(async () => {
    if (!getToken()) { setState({ ready: true, user: null, error: null }); return null; }
    setState((s) => ({ ...s, ready: false, error: null }));
    try {
      const me = await authApi.getMe();
      setState({ ready: true, user: me, error: null });
      return me;
    } catch (err) {
      // 401 만 로그아웃 처리. 서버·네트워크 오류는 토큰을 지우지 않고 "다시 시도"를 보여준다
      if (err.status === 401) clearToken();
      setState({ ready: true, user: null, error: err.status === 401 ? null : err });
      return null;
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const login = useCallback(async (email, password) => {
    const { accessToken, member } = await authApi.login({ email, password });
    setToken(accessToken);
    setState({ ready: true, user: member, error: null });
    return member;
  }, []);

  const logout = useCallback(async () => {
    // 요청을 먼저 보내고(토큰 헤더는 보내는 순간 붙음) 화면 쪽 로그아웃은 바로 처리한다.
    // 응답을 기다리다 페이지를 떠나도 토큰이 남지 않게.
    const pending = authApi.logout().catch(() => { /* 토큰이 이미 만료돼도 로그아웃은 진행 */ });
    clearToken();
    // 라우터 이동(navigate)도 transition 이라, 같은 transition 으로 묶어야
    // "메인으로 이동"보다 "로그인 풀림"이 먼저 그려져 보호 화면이 가로채는 일이 없다
    startTransition(() => setState({ ready: true, user: null, error: null }));
    await pending;
  }, []);

  /** 프로필 아이콘 변경 (Could) — 성공하면 상단 바 등 내 정보에 바로 반영 */
  const updateIcon = useCallback(async (iconKey) => {
    const me = await authApi.updateMyIcon(iconKey);
    setState((s) => ({ ...s, user: { ...s.user, ...me, profileIcon: me.profileIcon ?? iconKey } }));
    return me;
  }, []);

  /** 401 등으로 토큰이 지워졌을 때 화면 상태만 비운다 */
  const forget = useCallback(() => setState({ ready: true, user: null, error: null }), []);

  const value = useMemo(() => ({ ...state, login, logout, refresh, forget, updateIcon, signup: authApi.signup }), [state, login, logout, refresh, forget, updateIcon]);
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);
