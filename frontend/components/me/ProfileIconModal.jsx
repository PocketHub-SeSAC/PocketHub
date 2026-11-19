'use client';
/* 프로필 아이콘 선택 창 (?modal=profile-icon) — 어느 화면에서든 열린다 (Could)
   12개 도트 아이콘 + 기본(닉네임 첫 글자). 고르면 바로 저장: PATCH /api/v1/members/me { profileIcon } */
import { useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { PROFILE_ICONS } from '@/utils/profileIcons';
import useQuery from '@/hooks/useQuery';
import { Modal } from '@/components/common/Modal';
import { useToast } from '@/components/common/Toast';
import Icon from '@/components/common/Icon';
import { ProfileIconArt } from '@/components/common/Who';

export default function ProfileIconModal() {
  const [q, setQuery] = useQuery();
  const { user, updateIcon } = useAuth();
  const toast = useToast();
  const [busy, setBusy] = useState(null);
  const [err, setErr] = useState('');
  if (q.get('modal') !== 'profile-icon' || !user) return null;

  const handleClose = () => setQuery({ modal: null });
  const handlePick = async (key, label) => {
    if (key === (user.profileIcon || null)) { handleClose(); return; }
    setBusy(key ?? 'default'); setErr('');
    try { await updateIcon(key); toast(`프로필 아이콘을 ${label}(으)로 바꿨어요.`); handleClose(); }
    catch (e) { setErr(e.message); } finally { setBusy(null); }
  };

  return (
    <Modal title='아이콘 바꾸기' onClose={handleClose} size='sm' label='프로필 아이콘 선택'>
      <div className='fields'>
        {err && <div className='alert' role='alert'><Icon name='x' />{err}</div>}
        <p className='sub-hint'>고른 아이콘은 상단 바, 팀원 목록, 커밋·PR·리뷰 작성자, Task 담당자 옆에 보여요.</p>
        <div className='icon-grid' role='group' aria-label='프로필 아이콘'>
          {PROFILE_ICONS.map((ic) => (
            <button key={ic.key} type='button' className='icon-pick' aria-label={ic.label} aria-pressed={user.profileIcon === ic.key} data-autofocus={user.profileIcon === ic.key ? true : undefined}
              disabled={!!busy} onClick={() => handlePick(ic.key, ic.label)}>
              <ProfileIconArt iconKey={ic.key} size={40} />
              <span>{ic.label}</span>
            </button>
          ))}
          <button type='button' className='icon-pick' aria-label='기본 아이콘(닉네임 첫 글자)' aria-pressed={!user.profileIcon} data-autofocus={!user.profileIcon ? true : undefined}
            disabled={!!busy} onClick={() => handlePick(null, '기본 아이콘')}>
            <span className='icon-letter' aria-hidden='true'>{(user.nickname || '?').charAt(0)}</span>
            <span>기본</span>
          </button>
        </div>
        <div className='foot'><button className='btn' type='button' onClick={handleClose}>닫기</button></div>
      </div>
    </Modal>
  );
}
