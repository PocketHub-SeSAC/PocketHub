'use client';
/* 상단 바: 로고 / 비로그인 → 로그인·회원가입 / 로그인 → 닉네임(내 정보 패널)·PR 알림 배지·내 팀·로그아웃 */
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { usePrNoti } from '@/components/pull-request/PrNotiProvider';
import useQuery from '@/hooks/useQuery';
import { useToast } from './Toast';
import Icon from './Icon';
import { Avatar } from './Who';

export default function AppBar() {
  const { user, logout } = useAuth();
  const { total } = usePrNoti();
  const [, setQuery] = useQuery();
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();
  const onAuthPage = pathname === '/auth';

  // 메인으로 먼저 옮긴 뒤 로그아웃 (보호된 화면이 "로그인 필요"로 가로채지 않게)
  const handleLogout = async () => {
    router.push('/');
    await logout();
    toast('로그아웃했어요.');
  };

  return (
    <header className='appbar'>
      <div className='wrap'>
        <Link className='brand' href='/' aria-label='포켓 헙 메인으로'><Icon name='logo' /><span className='svc' /></Link>
        {user ? (
          <div className='me'>
            <button className='nick' type='button' onClick={() => setQuery({ panel: 'me' })} aria-label={`내 정보 보기: ${user.nickname}`}>
              <Avatar user={user} />{user.nickname}
            </button>
            {total > 0 && (
              <Link className='nbadge-link' href='/me#review' aria-label={`내가 리뷰할 PR ${total}건 보기`} title='내가 리뷰할 PR'>
                <span className='nbadge'>{total > 99 ? '99+' : total}</span>
              </Link>
            )}
            <Link className='btn btn-sm' href='/teams'>내 팀</Link>
            <button className='btn btn-sm' type='button' onClick={handleLogout}>로그아웃</button>
          </div>
        ) : (
          !onAuthPage && <Link className='btn btn-sm' href='/auth?tab=login'>로그인/회원가입</Link>
        )}
      </div>
    </header>
  );
}
