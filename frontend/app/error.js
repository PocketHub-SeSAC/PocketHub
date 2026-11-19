'use client';
// 화면을 그리다 오류가 나면 보여 줄 공통 오류 화면. 다시 시도하면 그 화면만 다시 그린다.
import PageWrap from '@/components/common/PageWrap';
import ListState from '@/components/common/ListState';

export default function ErrorPage({ reset }) {
  return <PageWrap><ListState error={{ message: '화면을 그리지 못했어요.' }} onRetry={reset} /></PageWrap>;
}
