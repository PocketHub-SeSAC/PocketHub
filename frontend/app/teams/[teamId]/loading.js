// 팀 화면을 불러오는 동안: 상단 팀 메뉴는 그대로 두고 본문에만 로딩 표시.
import ListState from '@/components/common/ListState';

export default function TeamLoading() {
  return <ListState loading />;
}
