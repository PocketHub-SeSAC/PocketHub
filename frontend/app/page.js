// 메인 화면 (/)
import { Suspense } from 'react';
import PageWrap from '@/components/common/PageWrap';
import MainScreen from '@/components/main/MainScreen';

export default function MainPage() {
  return <PageWrap><Suspense><MainScreen /></Suspense></PageWrap>;
}
