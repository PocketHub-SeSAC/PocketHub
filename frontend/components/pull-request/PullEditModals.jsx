'use client';
/* [담당 5] PR 수정·삭제 모달 — 작성자 본인, 리뷰 대기일 때만 (백엔드 PATCH·DELETE /pulls/{prId}) */
import { useState } from 'react';
import { updatePull, deletePull } from '@/services/pulls';
import { Modal } from '@/components/common/Modal';
import Field from '@/components/common/Field';
import Icon from '@/components/common/Icon';
import { useToast } from '@/components/common/Toast';

/** 제목·설명만 고친다 (커밋·Task 를 바꾸려면 PR 을 지우고 다시 만든다) */
export function EditPullModal({ teamId, pr, onClose, onSaved }) {
  const toast = useToast();
  const [v, setV] = useState({ title: pr.title, description: pr.description });
  const [err, setErr] = useState('');
  const [serverErr, setServerErr] = useState('');
  const [busy, setBusy] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!v.title.trim()) { setErr('PR 제목을 입력해 주세요.'); return; }
    setBusy(true); setServerErr('');
    try {
      await updatePull(teamId, pr.id, { title: v.title.trim(), description: v.description.trim() });
      toast('PR을 고쳤어요.');
      onSaved();
    } catch (er) { setServerErr(er.message); setBusy(false); }
  };
  return (
    <Modal title={`PR #${pr.id} 수정`} icon='pr' onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate>
        {serverErr && <div className='alert' role='alert'><Icon name='x' />{serverErr}</div>}
        <Field id='pr-edit-title' label='제목' required maxLength={100} value={v.title} error={err}
          onChange={(e) => { setV({ ...v, title: e.target.value }); setErr(''); }} />
        <Field id='pr-edit-desc' label='설명' optional as='textarea' rows={4} maxLength={4000} value={v.description}
          onChange={(e) => setV({ ...v, description: e.target.value })} />
        <p className='sub-hint'>포함된 커밋이나 Task를 바꾸려면 PR을 삭제하고 다시 만들어 주세요.</p>
        <div className='foot'>
          <button className='btn' type='button' onClick={onClose}>취소</button>
          <button className='btn btn-ink' type='submit' disabled={busy}>{busy ? '저장 중…' : '저장'}</button>
        </div>
      </form>
    </Modal>
  );
}

export function DeletePullModal({ teamId, pr, onClose, onDeleted }) {
  const toast = useToast();
  const [serverErr, setServerErr] = useState('');
  const [busy, setBusy] = useState(false);
  const handleDelete = async () => {
    setBusy(true); setServerErr('');
    try { await deletePull(teamId, pr.id); toast(`PR #${pr.id}을(를) 삭제했어요.`); onDeleted(); }
    catch (er) { setServerErr(er.message); setBusy(false); }
  };
  return (
    <Modal title='PR 삭제' icon='trash' onClose={onClose} size='sm'>
      <div className='fields'>
        {serverErr && <div className='alert' role='alert'><Icon name='x' />{serverErr}</div>}
        <p><b>#{pr.id} {pr.title}</b>을(를) 삭제할까요?</p>
        <p className='sub-hint'>묶여 있던 커밋은 풀려서 다른 PR에 다시 넣을 수 있어요.</p>
        <div className='foot'>
          <button className='btn' type='button' onClick={onClose}>취소</button>
          <button className='btn btn-no' type='button' onClick={handleDelete} disabled={busy}>{busy ? '삭제 중…' : '삭제'}</button>
        </div>
      </div>
    </Modal>
  );
}
