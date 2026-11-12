/* 사람 표시(아바타 + 닉네임).
   프로필 아이콘(profileIcon 키)을 골랐으면 도트 그림, 아니면 닉네임 첫 글자가 든 기본 아이콘. */
import { PROFILE_ICON_ART } from './profileIconArt';
import { iconLabel } from '@/utils/profileIcons';

const AV_STYLE = { 1: 'a1', 2: 'a3', 3: 'a4' };
const avClass = (u) => (u ? AV_STYLE[u.id] ?? ['', 'a1', 'a3', 'a4'][Number(u.id) % 4] : '');

/** 도트 프로필 아이콘 그림만 (선택 창 등에서 크게 쓸 때) */
export function ProfileIconArt({ iconKey, size = 20 }) {
  const art = PROFILE_ICON_ART[iconKey];
  if (!art) return null;
  return <svg className='px' width={size} height={size} viewBox='0 0 10 10' shapeRendering='crispEdges' aria-hidden='true' dangerouslySetInnerHTML={{ __html: art }} />;
}

export function Avatar({ user, title, size }) {
  if (!user) return null;
  const style = size ? { width: size, height: size } : undefined;
  if (user.profileIcon && PROFILE_ICON_ART[user.profileIcon]) {
    return (
      <span className='av av-ico' style={style} title={title || `${user.nickname} (${iconLabel(user.profileIcon)})`} aria-hidden='true'>
        <ProfileIconArt iconKey={user.profileIcon} size={size ? Math.round(size * 0.8) : 20} />
      </span>
    );
  }
  return <span className={`av ${avClass(user)}`} style={style} title={title || user.nickname} aria-hidden='true'>{(user.nickname || '?').charAt(0)}</span>;
}

/** user 가 없으면 emptyText 를 보여준다 (예: 담당자 없음) */
export default function Who({ user, me = false, emptyText = '', className = '' }) {
  if (!user) return emptyText ? <span className={`who none muted ${className}`}>{emptyText}</span> : null;
  return (
    <span className={`who ${className}`}>
      <Avatar user={user} />
      {user.nickname}{me ? ' (나)' : ''}
    </span>
  );
}
