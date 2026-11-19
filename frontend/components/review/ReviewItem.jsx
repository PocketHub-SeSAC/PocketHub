'use client';
/* [담당 5] 리뷰 말풍선 하나. 내가 쓴 리뷰만 수정·삭제할 수 있다 */
import { useState } from 'react';
import { Avatar } from '@/components/common/Who';
import { formatDateTime } from '@/utils/format';

export default function ReviewItem({ r, mine, onSave, onDelete }) {
  const [edit, setEdit] = useState(null);
  const [err, setErr] = useState('');
  const handleSave = async () => {
    if (!edit.trim()) { setErr('리뷰 내용을 입력해 주세요.'); return; }
    try { await onSave(r, edit.trim()); setEdit(null); setErr(''); } catch (er) { setErr(er.message); }
  };
  return (
    <div className={`bubble ${r.type === 'REJECT' ? 'reject' : ''}`}>
      <Avatar user={r.author} />
      <div className='box'>
        <div className='top'>
          <b>{r.author?.nickname}</b>
          {r.type === 'REJECT' && <span className='badge end'>거부 사유</span>}
          <span className='muted'>{formatDateTime(r.createdAt)}</span>
          {mine && edit === null && (
            <span className='tools'>
              <button className='linkbtn' type='button' onClick={() => setEdit(r.content)}>수정</button>
              <button className='linkbtn' type='button' onClick={() => onDelete(r)}>삭제</button>
            </span>
          )}
        </div>
        {edit === null ? r.content : (
          <div className='form' style={{ gap: 8 }}>
            <textarea className='input' rows={2} aria-label='리뷰 수정' value={edit} onChange={(e) => setEdit(e.target.value)} />
            {err && <p className='field-err'>{err}</p>}
            <div className='rowbtns'>
              <button className='btn btn-sm btn-ink' type='button' onClick={handleSave}>저장</button>
              <button className='btn btn-sm' type='button' onClick={() => { setEdit(null); setErr(''); }}>취소</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
