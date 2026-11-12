'use client';
/* 주소에 ?dev 를 붙이면 보이는 목업 조작판 (한 번 켜면 이 탭에서 계속 보임). 목업 모드에서만 동작 */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { USE_MOCK } from '@/services/client';
import { setToken, clearToken } from '@/services/token';
import { useAuth } from '@/components/auth/AuthProvider';

const KEY = 'pockethub.dev';
const USERS = [[1, '새싹'], [2, '달팽이'], [3, '도토리'], [4, '구름']];

export default function DevBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, refresh } = useAuth();
  const [on, setOn] = useState(false);
  const [flags, setFlags] = useState(null);
  const devParam = searchParams.has('dev');

  // sessionStorage 는 브라우저에만 있으므로 그린 뒤에 읽는다
  useEffect(() => {
    try { if (sessionStorage.getItem(KEY) === '1') setOn(true); } catch { /* 저장소를 못 쓰면 끈 채로 둔다 */ }
  }, []);

  useEffect(() => {
    if (devParam) {
      try { sessionStorage.setItem(KEY, '1'); } catch { /* 저장소를 못 써도 이번 화면에서는 켠다 */ }
      setOn(true);
    }
  }, [devParam]);

  useEffect(() => {
    if (on && USE_MOCK) import('@/mocks/server').then((m) => setFlags(m.getDevFlags()));
  }, [on]);

  if (!on || !USE_MOCK) return null;

  const handleFlagChange = async (patch) => { const m = await import('@/mocks/server'); setFlags(m.setDevFlags(patch)); };
  const handleLoginAs = async (id) => {
    const [{ getDb, saveDb }, { devLoginAs }] = await Promise.all([import('@/mocks/db'), import('@/mocks/handlers/auth')]);
    const token = devLoginAs(getDb(), id); saveDb(); setToken(token); await refresh();
  };
  const handleReset = async () => {
    const { resetDb } = await import('@/mocks/db');
    resetDb(); clearToken(); window.location.assign('/?dev');
  };
  const handleHide = () => { try { sessionStorage.removeItem(KEY); } catch { /* 저장소를 못 써도 화면에서는 숨긴다 */ } setOn(false); };
  const here = (p) => (pathname === p ? 'page' : undefined);

  return (
    <div className='mockbar' aria-label='목업 조작판'>
      <div className='wrap'>
        <span className='en'>MOCKUP</span>
        <nav className='grp' aria-label='화면 바로가기'>
          <Link href='/' aria-current={here('/')}>메인</Link>
          <Link href='/auth?tab=login' aria-current={here('/auth')}>로그인</Link>
          <Link href='/teams' aria-current={here('/teams')}>팀 목록</Link>
          <Link href='/teams/1' aria-current={here('/teams/1')}>팀 상세</Link>
          <Link href='/teams/1/files' aria-current={here('/teams/1/files')}>파일</Link>
          <Link href='/teams/1/commits' aria-current={here('/teams/1/commits')}>커밋</Link>
          <Link href='/teams/1/tasks' aria-current={here('/teams/1/tasks')}>태스크</Link>
          <Link href='/teams/1/pulls?status=waiting' aria-current={pathname.startsWith('/teams/1/pulls') ? 'page' : undefined}>PR</Link>
          <Link href='/teams/2'>기획 스터디</Link>
          <Link href='/teams/3'>남의 팀(404)</Link>
        </nav>
        <div className='row2'>
          <span className='lab'>로그인</span>
          <div className='grp'>
            {USERS.map(([id, nick]) => (
              <button key={id} type='button' aria-pressed={user?.id === id} onClick={() => handleLoginAs(id)}>{nick}</button>
            ))}
          </div>
          <span className='lab'>응답</span>
          <div className='grp'>
            {[[0, '즉시'], [250, '보통'], [1500, '느림']].map(([ms, t]) => (
              <button key={ms} type='button' aria-pressed={flags?.latency === ms} onClick={() => handleFlagChange({ latency: ms })}>{t}</button>
            ))}
            <button type='button' aria-pressed={!!flags?.failNext} onClick={() => handleFlagChange({ failNext: !flags?.failNext })}>다음 요청 실패</button>
          </div>
          <div className='grp'>
            <button type='button' onClick={handleReset}>목업 초기화</button>
            <button type='button' onClick={handleHide}>조작판 숨기기</button>
          </div>
        </div>
      </div>
    </div>
  );
}
