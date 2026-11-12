'use client';
/* 모든 화면 공통 틀: 알림·로그인·PR 알림 상태를 깔고, 상단 바·조작판·내 정보 패널을 붙인다.
   API 공통 오류 처리(401 → 로그인 화면, 404 → "찾을 수 없습니다.")도 여기서 연결한다. */
import { startTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { setApiHandlers } from '@/services/client';
import { applyTheme, getTheme } from '@/utils/theme';
import { AuthProvider, useAuth } from '@/components/auth/AuthProvider';
import { PrNotiProvider } from '@/components/pull-request/PrNotiProvider';
import ProfileIconModal from '@/components/me/ProfileIconModal';
import MeDrawer from '@/components/me/MeDrawer';
import { ToastProvider, useToast } from './Toast';
import AppBar from './AppBar';
import DevBar from './DevBar';

function AppFrame({ children }) {
  const router = useRouter();
  const toast = useToast();
  const { forget } = useAuth();

  useEffect(() => {
    setApiHandlers({
      unauthorized: () => {
        toast('로그인이 만료됐어요. 다시 로그인해 주세요.');
        const next = encodeURIComponent(window.location.pathname + window.location.search);
        // 라우터 이동은 transition 이라, 로그인 풀림도 같은 transition 으로 묶어야
        // 보호 화면(RequireAuth)이 먼저 "로그인 필요"로 가로채지 않는다
        startTransition(() => {
          forget();
          router.replace(`/auth?tab=login&next=${next}`);
        });
      },
      notFound: () => {
        toast('찾을 수 없습니다.');
        router.replace('/');
      },
    });
  }, [router, toast, forget]);

  return (
    <PrNotiProvider>
      <DevBar />
      <AppBar />
      {children}
      <MeDrawer />
      <ProfileIconModal />
    </PrNotiProvider>
  );
}

export default function AppShell({ children }) {
  // 깜빡임 방지 스크립트가 막힌 환경에서도 저장된 테마를 적용한다
  useEffect(() => { applyTheme(getTheme()); }, []);
  return (
    <ToastProvider>
      <AuthProvider>
        <AppFrame>{children}</AppFrame>
      </AuthProvider>
    </ToastProvider>
  );
}
