'use client';
/* [담당 4] Task 생성 모달 / Task 상세 패널 / 삭제 확인 */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createTask, getTask, updateTask, deleteTask, getTaskPulls } from '@/services/tasks';
import useAsync from '@/hooks/useAsync';
import { Modal } from '@/components/common/Modal';
import ListState from '@/components/common/ListState';
import Icon from '@/components/common/Icon';
import { useToast } from '@/components/common/Toast';
import { TaskFields, emptyTask, fromTask, toApiTask, validateTask, STATUS_LABEL } from './TaskForm';

const PR_BADGE = { waiting: ['리뷰 대기', 'badge wait'], approved: ['승인', 'badge ok'], closed: ['종료', 'badge end'] };

export function NewTaskModal({ teamId, members, onClose, onCreated }) {
  const toast = useToast();
  const [v, setV] = useState(emptyTask);
  const [errs, setErrs] = useState({});
  const [serverErr, setServerErr] = useState('');
  const [busy, setBusy] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault();
    const fe = validateTask(v);
    setErrs(fe); setServerErr('');
    if (Object.keys(fe).length) return;
    setBusy(true);
    try {
      const t = await createTask(teamId, toApiTask(v));
      toast(`"${t.title}"을(를) TODO에 붙였어요.`);
      onCreated(t);
    } catch (err) { setServerErr(err.message); setBusy(false); }
  };
  return (
    <Modal title='Task 생성' icon='task' onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate>
        {serverErr && <div className='alert' role='alert'><Icon name='x' />{serverErr}</div>}
        <TaskFields idPrefix='new-task' v={v} setV={setV} errs={errs} members={members} />
        <div className='foot'>
          <span className='hint muted'>새 Task는 TODO에 추가돼요.</span>
          <button className='btn' type='button' onClick={onClose}>취소</button>
          <button className='btn btn-ink' type='submit' disabled={busy}>{busy ? '등록 중…' : '등록'}</button>
        </div>
      </form>
    </Modal>
  );
}

export function DeleteTaskModal({ teamId, task, onClose, onDeleted }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [serverErr, setServerErr] = useState('');
  const handleDelete = async () => {
    setBusy(true);
    try { await deleteTask(teamId, task.id); toast(`"${task.title}"을(를) 삭제했어요.`); onDeleted(); }
    catch (err) { setServerErr(err.message); setBusy(false); }
  };
  return (
    <Modal title='Task 삭제' icon='trash' onClose={onClose} size='sm'>
      <div className='fields'>
        {serverErr && <div className='alert' role='alert'><Icon name='x' />{serverErr}</div>}
        <p><b>{task.title}</b>을(를) 삭제할까요?</p>
        <p className='sub-hint'>연결된 PR은 그대로 남지만 Task 연결은 사라져요.</p>
        <div className='foot'>
          <button className='btn' type='button' onClick={onClose}>취소</button>
          <button className='btn btn-no' type='button' onClick={handleDelete} disabled={busy}>{busy ? '삭제 중…' : '삭제'}</button>
        </div>
      </div>
    </Modal>
  );
}

/** 오른쪽 상세 패널 (?task=). 열 때 API-024·028 로 새로 받는다. version 이 바뀌면(보드에서 옮김 등) 다시 받는다 */
export function TaskSide({ teamId, taskId, members, version, onClose, onChanged, onDelete, onStatus }) {
  const toast = useToast();
  const task = useAsync(() => getTask(teamId, taskId), [teamId, taskId]);
  const pulls = useAsync(() => getTaskPulls(teamId, taskId), [teamId, taskId]);
  const [v, setV] = useState(null);
  const [errs, setErrs] = useState({});
  const [serverErr, setServerErr] = useState('');
  const [busy, setBusy] = useState(false);
  const { reload: reloadTask } = task;

  useEffect(() => { if (task.data) { setV(fromTask(task.data)); setErrs({}); setServerErr(''); } }, [task.data]);
  // 보드에서 옮기거나 저장한 뒤에는 깜빡임 없이 조용히 다시 받는다
  useEffect(() => { if (version) reloadTask(true); }, [version, reloadTask]);

  const handleSave = async (e) => {
    e.preventDefault();
    const fe = validateTask(v);
    setErrs(fe); setServerErr('');
    if (Object.keys(fe).length) return;
    setBusy(true);
    try { await updateTask(teamId, taskId, toApiTask(v)); toast('수정한 내용을 저장했어요.'); onChanged(); }
    catch (err) { setServerErr(err.message); } finally { setBusy(false); }
  };
  // 상태 변경은 보드와 같은 처리(방향 제한 없음, 승인 PR 확인, API-026)를 쓴다
  const handleStatusChange = (st) => {
    if (!task.data || task.data.status === st) return;
    onStatus(task.data, st);
  };

  return (
    <aside className='panel side' aria-label='Task 상세'>
      <div className='panel-head sidehead'><span>Task 상세</span><button className='xbtn' type='button' onClick={onClose} aria-label='Task 상세 닫기'><Icon name='x' /></button></div>
      <div className='pad'>
        <ListState loading={task.loading && !v} error={task.error} onRetry={() => task.reload()}>
          {v && task.data && (
            <form className='form' onSubmit={handleSave} noValidate>
              {serverErr && <div className='alert' role='alert'><Icon name='x' />{serverErr}</div>}
              <div className='field'>
                <span className='lbl' id='task-status-label'>상태</span>
                <div className='seg' role='group' aria-labelledby='task-status-label'>
                  {['TODO', 'DOING', 'DONE'].map((st) => (
                    <button key={st} type='button' aria-pressed={task.data.status === st} onClick={() => handleStatusChange(st)}>{STATUS_LABEL[st]}</button>
                  ))}
                </div>
              </div>
              <TaskFields idPrefix='task' v={v} setV={setV} errs={errs} members={members} />
              <div className='rowbtns'>
                <button className='btn btn-ink' type='submit' disabled={busy}>{busy ? '저장 중…' : '수정 저장'}</button>
                <button className='btn btn-no' type='button' onClick={onDelete}><Icon name='trash' />삭제</button>
              </div>
            </form>
          )}
        </ListState>
        <div>
          <div className='sec-label'><Icon name='pr' />연결된 PR</div>
          <ListState loading={pulls.loading} error={pulls.error} onRetry={() => pulls.reload()}
            empty={pulls.data && !pulls.data.length} emptyText='연결된 PR이 없어요.'>
            <ul className='items'>
              {(pulls.data || []).map((p) => (
                <li key={p.id} className='item'>
                  <Icon name='pr' />
                  <Link className='grow' href={`/teams/${teamId}/pulls/${p.id}?status=${p.status}`}>#{p.id} {p.title}</Link>
                  <span className={PR_BADGE[p.status][1]}>{PR_BADGE[p.status][0]}</span>
                </li>
              ))}
            </ul>
          </ListState>
        </div>
      </div>
    </aside>
  );
}
