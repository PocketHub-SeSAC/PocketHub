'use client';
/* 마이페이지 /me (Could) — 새 API 없이 기존 API 를 팀마다 불러 프론트에서 모은다 */

/* 1 프로필(아이콘·닉네임·이메일)  2 내가 맡은 Task  3 내가 리뷰할 PR(#review)  4 내 팀  5 최근 내 커밋 5개
   쓰는 API: 팀 목록(API-006), Task 목록(API-023), PR 목록(API-030, 리뷰 대기), Commit 목록(API-018) */
import { useEffect } from 'react';
import Link from 'next/link';
import useHash from '@/hooks/useHash';
import { getTeams } from '@/services/teams';
import { getTasks } from '@/services/tasks';
import { getPulls } from '@/services/pulls';
import { getCommits } from '@/services/files';
import { useAuth } from '@/components/auth/AuthProvider';
import useAsync from '@/hooks/useAsync';
import useQuery from '@/hooks/useQuery';
import ListState from '@/components/common/ListState';
import Icon from '@/components/common/Icon';
import Who, { Avatar } from '@/components/common/Who';
import { iconLabel } from '@/utils/profileIcons';
import { formatDate, shortDay } from '@/utils/format';

const STATUS_ORDER = { TODO: 0, DOING: 1, DONE: 2 };

async function loadMine(me) {
  const teams = await getTeams();
  const perTeam = await Promise.all(teams.map(async (t) => {
    const [tasks, waiting, commits] = await Promise.all([getTasks(t.id), getPulls(t.id, 'waiting'), getCommits(t.id)]);
    return { team: t, tasks, waiting, commits };
  }));
  return {
    teams: teams.map((t) => ({ ...t, owner: t.ownerId === me.id })),
    tasks: perTeam.flatMap(({ team, tasks }) => tasks.filter((x) => x.assignee?.id === me.id).map((x) => ({ ...x, team })))
      .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || String(a.dueDate || '9').localeCompare(String(b.dueDate || '9'))),
    reviews: perTeam.flatMap(({ team, waiting }) => waiting.filter((p) => p.reviewers.some((r) => r.id === me.id)).map((p) => ({ ...p, team }))),
    commits: perTeam.flatMap(({ team, commits }) => commits.filter((c) => c.author?.id === me.id).map((c) => ({ ...c, team })))
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))).slice(0, 5),
  };
}

function Section({ id, title, count, children }) {
  return (
    <section className='panel me-sec' id={id} aria-labelledby={`${id}-h`}>
      <div className='panel-head'><span id={`${id}-h`}>{title}{count !== undefined && ` ${count}`}</span></div>
      <div className='pad'>{children}</div>
    </section>
  );
}

export default function MeScreen() {
  const { user } = useAuth();
  const [, setQuery] = useQuery();
  const hash = useHash();
  const data = useAsync(() => loadMine(user), [user.id]);
  const d = data.data;

  // 상단 바 배지 → /me#review 로 오면 그 영역으로 스크롤
  useEffect(() => {
    if (d && hash) document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'start' });
  }, [d, hash]);

  const state = (list, emptyText) => ({ loading: data.loading, error: data.error, onRetry: () => data.reload(), empty: !!d && !list.length, emptyText });

  return (
    <>
      <div className='pagehead'>
        <div><h2 className='ko'>마이페이지</h2><p className='muted'>내가 맡은 일과 리뷰할 PR을 한곳에서 확인해요.</p></div>
      </div>
      <div className='me-grid'>
        <Section id='profile' title='프로필'>
          <div className='me-profile'>
            <button className='me-avatar' type='button' onClick={() => setQuery({ modal: 'profile-icon' })} aria-label='프로필 아이콘 바꾸기'>
              <Avatar user={user} size={64} />
            </button>
            <dl className='kv'>
              <dt>닉네임</dt><dd><b>{user.nickname}</b></dd>
              <dt>이메일</dt><dd>{user.email}</dd>
              <dt>아이콘</dt><dd>{user.profileIcon ? iconLabel(user.profileIcon) : '기본(닉네임 첫 글자)'}</dd>
            </dl>
          </div>
          <div className='rowbtns' style={{ marginTop: 14 }}>
            <button className='btn btn-sm' type='button' onClick={() => setQuery({ modal: 'profile-icon' })}>아이콘 바꾸기</button>
          </div>
        </Section>

        <Section id='review' title='내가 리뷰할 PR' count={d?.reviews.length}>
          <ListState {...state(d?.reviews || [], '리뷰할 PR이 없어요.')}>
            <ul className='items'>
              {(d?.reviews || []).map((p) => (
                <li key={`${p.team.id}-${p.id}`}>
                  <Link className='item me-link' href={`/teams/${p.team.id}/pulls/${p.id}?status=waiting`}>
                    <Icon name='pr' />
                    <span className='grow'><b>#{p.id} {p.title}</b><span className='size'> · {p.team.name}</span></span>
                    <Who user={p.author} />
                    <span className='badge wait'>리뷰 대기</span>
                  </Link>
                </li>
              ))}
            </ul>
          </ListState>
        </Section>

        <Section id='tasks' title='내가 맡은 Task' count={d?.tasks.length}>
          <ListState {...state(d?.tasks || [], '맡은 Task가 없어요.')}>
            <ul className='items'>
              {(d?.tasks || []).map((t) => (
                <li key={`${t.team.id}-${t.id}`}>
                  <Link className='item me-link' href={`/teams/${t.team.id}/tasks?task=${t.id}`}>
                    <span className={`me-dot n-${t.status.toLowerCase()}`} aria-hidden='true' />
                    <span className='grow'><b>{t.title}</b><span className='size'> · {t.team.name}{t.dueDate ? ` · ~ ${shortDay(t.dueDate)}` : ''}</span></span>
                    <span className='badge'>{t.status}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </ListState>
        </Section>

        <Section id='teams' title='내 팀' count={d?.teams.length}>
          <ListState {...state(d?.teams || [], '소속된 팀이 없어요.')}>
            <ul className='items'>
              {(d?.teams || []).map((t) => (
                <li key={t.id}>
                  <Link className='item me-link' href={`/teams/${t.id}`}>
                    <Icon name='team' />
                    <span className='grow'><b>{t.name}</b><span className='size'> · 팀원 {t.memberCount}명</span></span>
                    <span className={`badge ${t.owner ? 'pri' : ''}`}>{t.owner ? '팀 생성자' : '팀원'}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </ListState>
        </Section>

        <Section id='commits' title='최근 내 커밋'>
          <ListState {...state(d?.commits || [], '아직 내 커밋이 없어요.')}>
            <ul className='items'>
              {(d?.commits || []).map((c) => (
                <li key={`${c.team.id}-${c.id}`}>
                  <Link className='item me-link' href={`/teams/${c.team.id}/commits?commit=${c.id}`}>
                    <Icon name='commit' />
                    <span className='grow'><b>{c.message}</b><span className='size'> · {c.team.name} · {formatDate(c.createdAt)}</span></span>
                    <span className={c.type === 'DELETE' ? 'badge end' : 'badge'}>{c.type === 'DELETE' ? '삭제' : '업로드'}</span>
                    <span className='id'>{c.hash}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </ListState>
        </Section>
      </div>
    </>
  );
}
