'use client';
/* [담당 5] PR 거부 모달 (?modal=reject). 거부 사유는 필수이고 리뷰로 남는다 */
import { useState } from 'react';
import { Modal } from '@/components/common/Modal';
import Field from '@/components/common/Field';
import Icon from '@/components/common/Icon';

export default function RejectModal({ onClose, onSubmit }) {
  const [reason, setReason] = useState('');
  const [err, setErr] = useState('');
  const [serverErr, setServerErr] = useState('');
  const [busy, setBusy] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) { setErr('거부 사유를 입력해 주세요. 사유는 리뷰로 남아요.'); return; }
    setBusy(true); setServerErr('');
    try { await onSubmit(reason.trim()); } catch (er) { setServerErr(er.message); setBusy(false); }
  };
  return (
    <Modal title='PR 거부' icon='x' onClose={onClose} size='sm'>
      <form onSubmit={handleSubmit} noValidate>
        {serverErr && <div className='alert' role='alert'><Icon name='x' />{serverErr}</div>}
        <p className='sub-hint'>거부하면 PR이 종료되고, 이 PR의 커밋과 그 커밋으로 올라간 파일 버전이 목록에서 빠져요.</p>
        <Field id='reject-reason' label='거부 사유' required as='textarea' rows={3} maxLength={1000} placeholder='왜 거부하는지 알려 주세요' value={reason} error={err}
          onChange={(e) => { setReason(e.target.value); setErr(''); }} />
        <div className='foot'>
          <button className='btn' type='button' onClick={onClose}>취소</button>
          <button className='btn btn-no' type='submit' disabled={busy}>{busy ? '처리 중…' : '거부'}</button>
        </div>
      </form>
    </Modal>
  );
}
