// 마이페이지 (/me, #review = 내가 리뷰할 PR)
import { Suspense } from 'react';
import PageWrap from '@/components/common/PageWrap';
import MeScreen from '@/components/me/MeScreen';

export default function MePage() {
  return <PageWrap><Suspense><MeScreen /></Suspense></PageWrap>;
}
