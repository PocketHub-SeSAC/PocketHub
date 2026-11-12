'use client';
/* [담당 2] 팀 생성 모달 (?modal=create-team) — 메인·팀 목록 공용
   팀 이름 필수, 설명 선택. 만든 사람은 자동으로 팀 생성자(팀원)가 된다. */
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createTeam } from '@/services/teams';
import { Modal } from '@/components/common/Modal';
import Field from '@/components/common/Field';
import Icon from '@/components/common/Icon';
import { useToast } from '@/components/common/Toast';

export default function CreateTeamModal({ onClose }) {
  const router = useRouter();
  const toast = useToast();
  const [v, setV] = useState({ name: '', description: '' });
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
      const team = await createTeam({ name, description: v.description.trim() });
      toast(`"${team.name}" 팀을 만들었어요.`);
      router.push(`/teams/${team.id}`);
    } catch (err) {
      setServerErr(err.message);
      setBusy(false);
    }
  };

  return (
    <Modal title='팀 만들기' icon='team' onClose={onClose} size='sm'>
      <form onSubmit={handleSubmit} noValidate>
        {serverErr && <div className='alert' role='alert'><Icon name='x' />{serverErr}</div>}
        <Field id='team-name' label='팀 이름' required maxLength={30} placeholder='예: 포켓 개발팀' value={v.name} error={errs.name}
          onChange={(e) => setV({ ...v, name: e.target.value })} />
        <Field id='team-desc' label='설명' optional as='textarea' rows={3} maxLength={200} placeholder='팀을 소개해 주세요' value={v.description} error={errs.description}
          onChange={(e) => setV({ ...v, description: e.target.value })} />
        <div className='foot'>
          <span className='hint muted'>만든 사람은 자동으로 팀 생성자가 돼요.</span>
          <button className='btn' type='button' onClick={onClose}>취소</button>
          <button className='btn btn-ink' type='submit' disabled={busy}>{busy ? '만드는 중…' : '만들기'}</button>
        </div>
      </form>
    </Modal>
  );
}
