// 커밋 이력 (/teams/[teamId]/commits, ?commit=)
import { Suspense } from 'react';
import CommitsScreen from '@/components/commit/CommitsScreen';

export default function CommitsPage() {
  return <Suspense><CommitsScreen /></Suspense>;
}
