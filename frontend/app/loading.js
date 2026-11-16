// 화면을 불러오는 동안 보여 줄 공통 로딩 표시.
import PageWrap from '@/components/common/PageWrap';
import ListState from '@/components/common/ListState';

export default function Loading() {
  return <PageWrap><ListState loading /></PageWrap>;
}
