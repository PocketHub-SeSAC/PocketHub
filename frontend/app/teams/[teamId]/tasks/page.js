// 태스크 보드 (/teams/[teamId]/tasks, ?modal=new-task, ?task=, &modal=delete-task)
import { Suspense } from 'react';
import TasksScreen from '@/components/task/TasksScreen';

export default function TasksPage() {
  return <Suspense><TasksScreen /></Suspense>;
}
