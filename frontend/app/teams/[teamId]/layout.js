// 팀 화면 공통: 팀·팀원을 불러와 상단 팀 메뉴와 함께 보여준다. 소속되지 않은 팀이면 "찾을 수 없습니다."
import TeamShell from '@/components/team/TeamShell';

export default function TeamLayout({ children }) {
  return <TeamShell>{children}</TeamShell>;
}
