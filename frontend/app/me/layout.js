// 마이페이지는 로그인해야 들어온다.
import RequireAuth from '@/components/common/RequireAuth';

export default function MeLayout({ children }) {
  return <RequireAuth>{children}</RequireAuth>;
}
