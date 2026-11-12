'use client';
/* [담당 2] 팀 상세의 모달: 정보 수정(?modal=edit-team) / 팀 삭제(?modal=delete-team) / 팀원 정보(?member=:userId) */
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateTeam, deleteTeam } from '@/services/teams';
import { Modal } from '@/components/common/Modal';
import Field from '@/components/common/Field';
import Icon from '@/components/common/Icon';
import { Avatar } from '@/components/common/Who';
import { useToast } from '@/components/common/Toast';
import { formatDate } from '@/utils/format';

export function EditTeamModal({ team, onClose, onSaved }) {
  const toast = useToast();
  const [v, setV] = useState({ name: team.name, description: team.description });
  const [errs, setErrs] = useState({});
  const [serverErr, setServerErr] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const name = v.name.trim();
    const fe = {
      name: !name ? '팀 이름을 입력해 주세요.' : name.length > 30 ? '팀 이름은 30자 이하로 입력해 주세요.' : '',
      description: v.description.trim().length > 200 ? '설명은 200자 이하로 입력해 주세요.' : '',
    };
    setErrs(fe); setServerErr('');
    if (fe.name || fe.description) return;
    setBusy(true);
    try {
      await updateTeam(team.id, { name, description: v.description.trim() });
      toast('팀 정보를 저장했어요.');
      onSaved();
    } catch (err) { setServerErr(err.message); setBusy(false); }
  };

  return (
    <Modal title='팀 정보 수정' icon='team' onClose={onClose} size='sm'>
      <form onSubmit={handleSubmit} noValidate>
        {serverErr && <div className='alert' role='alert'><Icon name='x' />{serverErr}</div>}
        <Field id='edit-team-name' label='팀 이름' required maxLength={30} value={v.name} error={errs.name} onChange={(e) => setV({ ...v, name: e.target.value })} />
        <Field id='edit-team-desc' label='설명' optional as='textarea' rows={3} maxLength={200} value={v.description} error={errs.description} onChange={(e) => setV({ ...v, description: e.target.value })} />
        <div className='foot'>
          <button className='btn' type='button' onClick={onClose}>취소</button>
          <button className='btn btn-ink' type='submit' disabled={busy}>{busy ? '저장 중…' : '저장'}</button>
        </div>
      </form>
    </Modal>
  );
}

export function DeleteTeamModal({ team, onClose }) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [serverErr, setServerErr] = useState('');

  const handleConfirm = async () => {
    setBusy(true); setServerErr('');
    try {
      await deleteTeam(team.id);
      toast(`"${team.name}" 팀을 삭제했어요.`);
      router.replace('/teams');
    } catch (err) { setServerErr(err.message); setBusy(false); }
  };

  return (
    <Modal title='팀 삭제' icon='trash' onClose={onClose} size='sm'>
      <div className='fields'>
        {serverErr && <div className='alert' role='alert'><Icon name='x' />{serverErr}</div>}
        <p><b>{team.name}</b> 팀을 삭제할까요?</p>
        <p className='desc'>팀을 삭제하면 파일·커밋·Task·PR이 모두 사라집니다. 되돌릴 수 없어요.</p>
        <div className='foot'>
          <button className='btn' type='button' onClick={onClose}>취소</button>
          <button className='btn btn-no' type='button' onClick={handleConfirm} disabled={busy}>{busy ? '삭제 중…' : '삭제'}</button>
        </div>
      </div>
    </Modal>
  );
}

/** 팀원 정보: 팀원 목록(API-010) 데이터로 보여준다 */
export function MemberModal({ member, onClose }) {
  return (
    <Modal title='팀원 정보' onClose={onClose} size='sm'>
      <div className='fields'>
        <div className='who' style={{ fontSize: 18 }}><Avatar user={member} />{member.nickname}</div>
        <dl className='kv'>
          <dt>닉네임</dt><dd id='mi-nn'>{member.nickname}</dd>
          <dt>이메일</dt><dd id='mi-em'>{member.email}</dd>
          <dt>역할</dt><dd id='mi-role'>{member.role === 'OWNER' ? '팀 생성자' : '팀원'}</dd>
          {member.joinedAt && <><dt>합류일</dt><dd>{formatDate(member.joinedAt)}</dd></>}
        </dl>
        <div className='foot'><button className='btn' type='button' onClick={onClose}>닫기</button></div>
      </div>
    </Modal>
  );
}
