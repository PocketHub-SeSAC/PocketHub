'use client';
/* 로그인해야 들어오는 화면을 감싼다. 비로그인이면 로그인 화면으로 보내고, 로그인 후 원래 화면(next)으로 돌아온다 */
import { useEffect, useRef } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from './Toast';
import ListState from './ListState';
import PageWrap from './PageWrap';
import Redirect from './Redirect';

export default function RequireAuth({ children }) {
  const { ready, user, error, refresh } = useAuth();
  const toast = useToast();
  const told = useRef(false);
  const needLogin = ready && !user && !error;

  useEffect(() => {
    if (needLogin && !told.current) { told.current = true; toast('로그인이 필요해요. 로그인하면 보던 화면으로 돌아가요.'); }
  }, [needLogin, toast]);

  if (!ready) return <PageWrap><ListState loading /></PageWrap>;
  // 내 정보 확인이 서버·네트워크 오류로 실패: 로그인은 유지하고 다시 시도
  if (error) return <PageWrap><ListState error={error} onRetry={refresh} /></PageWrap>;
  if (!user) {
    // ready 는 브라우저에서만 true 가 되므로 여기서는 window 를 읽어도 된다
    const next = encodeURIComponent(window.location.pathname + window.location.search);
    return <Redirect to={`/auth?tab=login&next=${next}`} />;
  }
  return children;
}
