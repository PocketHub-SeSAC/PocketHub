import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { USE_MOCK } from '../api/client';
import { setToken, clearToken } from '../api/token';
import { useAuth } from '../auth/AuthContext';

/* 주소에 ?dev 를 붙이면 보이는 목업 조작판 (한 번 켜면 이 탭에서 계속 보임). 목업 모드에서만 동작 */
const KEY = 'pockethub.dev';
const USERS = [[1, '새싹'], [2, '달팽이'], [3, '도토리'], [4, '구름']];

export default function DevBar() {
  const location = useLocation();
  const { user, refresh } = useAuth();
  const [on, setOn] = useState(() => { try { return sessionStorage.getItem(KEY) === '1'; } catch { return false; } });
  const [flags, setFlags] = useState(null);

  useEffect(() => {
    if (new URLSearchParams(location.search).has('dev')) {
      try { sessionStorage.setItem(KEY, '1'); } catch { /* 무시 */ }
      setOn(true);
    }
  }, [location.search]);

  useEffect(() => {
    if (on && USE_MOCK) import('../mock/server').then((m) => setFlags(m.getDevFlags()));
  }, [on]);

  if (!on || !USE_MOCK) return null;

  const setFlag = async (patch) => { const m = await import('../mock/server'); setFlags(m.setDevFlags(patch)); };
  const loginAs = async (id) => {
    const [{ getDb, saveDb }, { devLoginAs }] = await Promise.all([import('../mock/db'), import('../mock/handlers/auth')]);
    const token = devLoginAs(getDb(), id); saveDb(); setToken(token); await refresh();
  };
  const reset = async () => {
    const { resetDb } = await import('../mock/db');
    resetDb(); clearToken(); window.location.assign('/?dev');
  };
  const hide = () => { try { sessionStorage.removeItem(KEY); } catch { /* 무시 */ } setOn(false); };
  const here = (p) => (location.pathname === p ? 'page' : undefined);

  return (
    <div className="mockbar" aria-label="목업 조작판">
      <div className="wrap">
        <span className="en">MOCKUP</span>
        <nav className="grp" aria-label="화면 바로가기">
          <Link to="/" aria-current={here('/')}>메인</Link>
          <Link to="/auth?tab=login" aria-current={here('/auth')}>로그인</Link>
          <Link to="/teams" aria-current={here('/teams')}>팀 목록</Link>
          <Link to="/teams/1" aria-current={here('/teams/1')}>팀 상세</Link>
          <Link to="/teams/1/files" aria-current={here('/teams/1/files')}>파일</Link>
          <Link to="/teams/1/commits" aria-current={here('/teams/1/commits')}>커밋</Link>
          <Link to="/teams/1/tasks" aria-current={here('/teams/1/tasks')}>태스크</Link>
          <Link to="/teams/1/pulls?status=waiting" aria-current={location.pathname.startsWith('/teams/1/pulls') ? 'page' : undefined}>PR</Link>
          <Link to="/teams/2">기획 스터디</Link>
          <Link to="/teams/3">남의 팀(404)</Link>
        </nav>
        <div className="row2">
          <span className="lab">로그인</span>
          <div className="grp">
            {USERS.map(([id, nick]) => (
              <button key={id} type="button" aria-pressed={user?.id === id} onClick={() => loginAs(id)}>{nick}</button>
            ))}
          </div>
          <span className="lab">응답</span>
          <div className="grp">
            {[[0, '즉시'], [250, '보통'], [1500, '느림']].map(([ms, t]) => (
              <button key={ms} type="button" aria-pressed={flags?.latency === ms} onClick={() => setFlag({ latency: ms })}>{t}</button>
            ))}
            <button type="button" aria-pressed={!!flags?.failNext} onClick={() => setFlag({ failNext: !flags?.failNext })}>다음 요청 실패</button>
          </div>
          <div className="grp">
            <button type="button" onClick={reset}>목업 초기화</button>
            <button type="button" onClick={hide}>조작판 숨기기</button>
          </div>
        </div>
      </div>
    </div>
  );
}
