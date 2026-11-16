// 로그인/회원가입 화면 (/auth?tab=login|signup&next=돌아갈 주소)
import { Suspense } from 'react';
import PageWrap from '@/components/common/PageWrap';
import AuthScreen from '@/components/auth/AuthScreen';

export default function AuthPage() {
  return <PageWrap><Suspense><AuthScreen /></Suspense></PageWrap>;
}
