// 팀 상세 (/teams/[teamId], ?modal=edit-team|delete-team, ?member=)
import { Suspense } from 'react';
import TeamDetailScreen from '@/components/team/TeamDetailScreen';

export default function TeamDetailPage() {
  return <Suspense><TeamDetailScreen /></Suspense>;
}
