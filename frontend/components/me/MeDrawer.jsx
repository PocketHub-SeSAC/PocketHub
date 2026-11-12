'use client';
/* 내 정보 패널 (?panel=me) — 열 때 API-002 로 새로 받는다 */
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { getMe } from '@/services/auth';
import useAsync from '@/hooks/useAsync';
import useQuery from '@/hooks/useQuery';
import { useToast } from '@/components/common/Toast';
import { Drawer } from '@/components/common/Modal';
import ListState from '@/components/common/ListState';
import { Avatar } from '@/components/common/Who';

export default function MeDrawer() {
  const [q, setQuery] = useQuery();
  const { user, logout } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const open = q.get('panel') === 'me' && !!user;
  const me = useAsync(open ? getMe : null, [open]);
  if (!open) return null;

  const handleClose = () => setQuery({ panel: null });
  const handleLogout = async () => { router.push('/'); await logout(); toast('로그아웃했어요.'); };

  return (
    <Drawer title='내 정보' onClose={handleClose}>
      <div className='pad'>
        <ListState loading={me.loading} error={me.error} onRetry={() => me.reload()}>
          {me.data && (
            <>
              <div className='who' style={{ fontSize: 18 }}><Avatar user={user} size={32} />{me.data.nickname}</div>
              <dl className='kv'><dt>닉네임</dt><dd>{me.data.nickname}</dd><dt>이메일</dt><dd>{me.data.email}</dd></dl>
            </>
          )}
        </ListState>
        <div className='rowbtns'>
          <Link className='btn btn-ink' href='/me' onClick={handleClose}>마이페이지</Link>
          <button className='btn' type='button' onClick={() => setQuery({ panel: null, modal: 'profile-icon' })}>아이콘 바꾸기</button>
          <button className='btn' type='button' onClick={handleLogout}>로그아웃</button>
        </div>
      </div>
    </Drawer>
  );
}
