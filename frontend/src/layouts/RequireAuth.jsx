import { useEffect, useRef } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useToast } from '../components/Toast';
import ListState from '../components/ListState';
import Page from './Page';

/* 로그인해야 들어오는 화면. 비로그인이면 로그인 화면으로 보내고, 로그인 후 원래 화면(next)으로 돌아온다 */
export default function RequireAuth() {
  const { ready, user, error, refresh } = useAuth();
  const location = useLocation();
  const toast = useToast();
  const told = useRef(false);
  const needLogin = ready && !user && !error;

  useEffect(() => {
    if (needLogin && !told.current) { told.current = true; toast('로그인이 필요해요. 로그인하면 보던 화면으로 돌아가요.'); }
  }, [needLogin, toast]);

  if (!ready) return <Page><ListState loading /></Page>;
  // 내 정보 확인이 서버·네트워크 오류로 실패: 로그인은 유지하고 다시 시도
  if (error) return <Page><ListState error={error} onRetry={refresh} /></Page>;
  if (!user) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/auth?tab=login&next=${next}`} replace />;
  }
  return <Outlet />;
}
