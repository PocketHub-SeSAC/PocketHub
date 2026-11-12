// 파일 (/teams/[teamId]/files, ?modal=upload, ?file=, &modal=delete-file)
import { Suspense } from 'react';
import FilesScreen from '@/components/file/FilesScreen';

export default function FilesPage() {
  return <Suspense><FilesScreen /></Suspense>;
}
