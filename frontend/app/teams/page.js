// 팀 목록 (/teams, ?modal=create-team)
import { Suspense } from 'react';
import PageWrap from '@/components/common/PageWrap';
import TeamListScreen from '@/components/team/TeamListScreen';

export default function TeamListPage() {
  return <PageWrap><Suspense><TeamListScreen /></Suspense></PageWrap>;
}
