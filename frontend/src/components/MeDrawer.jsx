import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { getMe } from '../api/auth';
import useAsync from '../hooks/useAsync';
import useQuery from '../hooks/useQuery';
import { useToast } from './Toast';
import { Drawer } from './Modal';
import ListState from './ListState';
import { Avatar } from './Who';

/* 내 정보 패널 (?panel=me) — 열 때 API-002 로 새로 받는다 */
export default function MeDrawer() {
  const [q, setQuery] = useQuery();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const open = q.get('panel') === 'me' && !!user;
  const me = useAsync(open ? getMe : null, [open]);
  if (!open) return null;

  const close = () => setQuery({ panel: null });
  const doLogout = async () => { navigate('/'); await logout(); toast('로그아웃했어요.'); };

  return (
    <Drawer title="내 정보" onClose={close}>
      <div className="pad">
        <ListState loading={me.loading} error={me.error} onRetry={() => me.reload()}>
          {me.data && (
            <>
              <div className="who" style={{ fontSize: 18 }}><Avatar user={user} size={32} />{me.data.nickname}</div>
              <dl className="kv"><dt>닉네임</dt><dd>{me.data.nickname}</dd><dt>이메일</dt><dd>{me.data.email}</dd></dl>
            </>
          )}
        </ListState>
        <div className="rowbtns">
          <Link className="btn btn-ink" to="/me" onClick={close}>마이페이지</Link>
          <button className="btn" type="button" onClick={() => setQuery({ panel: null, modal: 'profile-icon' })}>아이콘 바꾸기</button>
          <button className="btn" type="button" onClick={doLogout}>로그아웃</button>
        </div>
      </div>
    </Drawer>
  );
}
