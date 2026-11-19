'use client';
/* [담당 5] PR 수정·삭제·Task 연결 모달 — 작성자 본인, 리뷰 대기일 때만
   (백엔드 PATCH·DELETE /pulls/{prId}, PATCH /pulls/{prId}/task) */
import { useState } from 'react';
import { updatePull, deletePull, changePullTask } from '@/services/pulls';
import { getTasks } from '@/services/tasks';
import useAsync from '@/hooks/useAsync';
import { Modal } from '@/components/common/Modal';
import Field from '@/components/common/Field';
import Icon from '@/components/common/Icon';
import { useToast } from '@/components/common/Toast';

/** 제목·설명만 고친다 (Task 는 TaskPullModal, 커밋을 바꾸려면 PR 을 지우고 다시 만든다) */
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
        <p className='sub-hint'>연결된 Task는 PR 상세의 Task 옆 [변경]에서 바꿀 수 있어요. 포함된 커밋을 바꾸려면 PR을 삭제하고 다시 만들어 주세요.</p>
        <div className='foot'>
          <button className='btn' type='button' onClick={onClose}>취소</button>
          <button className='btn btn-ink' type='submit' disabled={busy}>{busy ? '저장 중…' : '저장'}</button>
        </div>
      </form>
    </Modal>
  );
}

/** 연결 Task 다시 연결·변경 — 연결된 Task 가 삭제됐을 때 같은 팀 Task 를 골라 다시 연결한다 */
export function TaskPullModal({ teamId, pr, onClose, onSaved }) {
  const toast = useToast();
  const tasks = useAsync(() => getTasks(teamId), [teamId]);
  const [taskId, setTaskId] = useState(pr.task ? String(pr.task.id) : '');
  const [err, setErr] = useState('');
  const [serverErr, setServerErr] = useState('');
  const [busy, setBusy] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!taskId) { setErr('연결할 Task를 골라 주세요.'); return; }
    setBusy(true); setServerErr('');
    try {
      await changePullTask(teamId, pr.id, { taskId: Number(taskId) });
      toast(pr.task ? '연결된 Task를 바꿨어요.' : 'Task를 다시 연결했어요.');
      onSaved();
    } catch (er) { setServerErr(er.message); setBusy(false); }
  };
  return (
    <Modal title={pr.task ? `PR #${pr.id} Task 변경` : `PR #${pr.id} Task 다시 연결`} icon='task' onClose={onClose} size='sm'>
      <form onSubmit={handleSubmit} noValidate>
        {serverErr && <div className='alert' role='alert'><Icon name='x' />{serverErr}</div>}
        {!pr.task && <p className='sub-hint'>연결돼 있던 Task가 삭제됐어요. 이 PR과 연결할 Task를 다시 골라 주세요.</p>}
        <Field id='pr-relink-task' label='연결할 Task' required as='select' value={taskId} error={err}
          onChange={(e) => { setTaskId(e.target.value); setErr(''); }}>
          <option value=''>{tasks.loading ? '불러오는 중…' : 'Task를 골라 주세요'}</option>
          {(tasks.data || []).map((t) => <option key={t.id} value={String(t.id)}>[{t.status}] {t.title}</option>)}
        </Field>
        {tasks.error && <p className='field-err' role='alert'>Task 목록을 불러오지 못했어요.</p>}
        <div className='foot'>
          <button className='btn' type='button' onClick={onClose}>취소</button>
          <button className='btn btn-ink' type='submit' disabled={busy}>{busy ? '저장 중…' : '연결'}</button>
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
