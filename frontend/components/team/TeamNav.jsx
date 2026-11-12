'use client';
/* [담당 2] 팀 화면 공통 메뉴: 팀 이름 + 4개 메뉴, 현재 화면 표시, PR 탭 알림 배지 */
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Icon from '@/components/common/Icon';
import { usePrNoti, NotiBadge } from '@/components/pull-request/PrNotiProvider';

const MENUS = [
  { key: 'detail', label: '팀 상세', to: '', match: (rest) => rest === '' },
  { key: 'files', label: '파일·커밋', to: '/files', match: (rest) => rest.startsWith('/files') || rest.startsWith('/commits') },
  { key: 'tasks', label: '태스크 보드', to: '/tasks', match: (rest) => rest.startsWith('/tasks') },
  { key: 'pulls', label: 'PR', to: '/pulls', match: (rest) => rest.startsWith('/pulls') },
];

export default function TeamNav({ team }) {
  const pathname = usePathname();
  const { byTeam } = usePrNoti();
  const noti = byTeam[String(team.id)] || { review: 0, decided: [] };
  const base = `/teams/${team.id}`;
  const rest = pathname.startsWith(base) ? pathname.slice(base.length).replace(/\/$/, '') : '';
  return (
    <nav className='teamnav' id='teamnav' aria-label='팀 메뉴'>
      <div className='wrap'>
        <div className='team-name'><Icon name='team' />{team.name}</div>
        <div className='nav'>
          {MENUS.map((m) => (
            <Link key={m.key} href={base + m.to} aria-current={m.match(rest) ? 'page' : undefined}>
              {m.label}
              {m.key === 'pulls' && <NotiBadge n={noti.review} dot={noti.decided.length > 0} />}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
