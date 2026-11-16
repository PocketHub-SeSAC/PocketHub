// PR 화면 (/teams/[teamId]/pulls?status=waiting|approved|closed, /pulls/[prId], ?modal=new-pr|reject)
// 목록과 상세가 한 화면이라, PR 을 바꿔도 목록을 다시 불러오지 않도록 레이아웃에서 그린다.
import { Suspense } from 'react';
import PullsScreen from '@/components/pull-request/PullsScreen';

export default function PullsLayout({ children }) {
  return (
    <>
      <Suspense><PullsScreen /></Suspense>
      {children}
    </>
  );
}
