// 팀 목록과 팀 화면 전체는 로그인해야 들어온다.
import RequireAuth from '@/components/common/RequireAuth';

export default function TeamsLayout({ children }) {
  return <RequireAuth>{children}</RequireAuth>;
}
