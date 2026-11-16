'use client';
/* [담당 5] PR 생성 모달 (?modal=new-pr) */

/* - 커밋: 내 커밋 중 아직 PR 에 연결되지 않은 것만, 1개 이상
   - 리뷰어: 본인을 뺀 팀원 중 1명 이상
   - Task: 1개 연결
   만들면 바로 "리뷰 대기" */
import { useState } from 'react';
import { createPull } from '@/services/pulls';
import { getCommits } from '@/services/files';
import { getTasks } from '@/services/tasks';
import useAsync from '@/hooks/useAsync';
import { Modal } from '@/components/common/Modal';
import Field from '@/components/common/Field';
import FieldError from '@/components/common/FieldError';
import ListState from '@/components/common/ListState';
import Icon from '@/components/common/Icon';
import Who from '@/components/common/Who';
import { useToast } from '@/components/common/Toast';
import { formatDate } from '@/utils/format';

function CheckItem({ checked, onToggle, children }) {
  return (
    <div className='item' role='checkbox' aria-checked={checked} tabIndex={0} onClick={onToggle}
      onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); onToggle(); } }}>
      <span className='cb' aria-hidden='true'>{checked && <Icon name='check' size={10} />}</span>
      {children}
    </div>
  );
}

export default function NewPullModal({ teamId, me, members, onClose, onCreated }) {
  const toast = useToast();
  const commits = useAsync(() => getCommits(teamId), [teamId]);
  const tasks = useAsync(() => getTasks(teamId), [teamId]);
  const [v, setV] = useState({ title: '', description: '', commitIds: [], reviewerIds: [], taskId: '' });
  const [errs, setErrs] = useState({});
  const [serverErr, setServerErr] = useState('');
  const [busy, setBusy] = useState(false);
  const myFree = (commits.data || []).filter((c) => c.author?.id === me.id && !c.prId);
  const reviewers = members.filter((m) => m.id !== me.id);
  const handleToggle = (key, id) => setV((s) => ({ ...s, [key]: s[key].includes(id) ? s[key].filter((x) => x !== id) : [...s[key], id] }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fe = {
      title: v.title.trim() ? '' : 'PR 제목을 입력해 주세요.',
      commits: v.commitIds.length ? '' : '포함할 커밋을 1개 이상 골라 주세요.',
      reviewers: v.reviewerIds.length ? '' : '리뷰어를 1명 이상 골라 주세요.',
      task: v.taskId ? '' : '연결할 Task를 골라 주세요.',
    };
    setErrs(fe); setServerErr('');
    if (Object.values(fe).some(Boolean)) return;
    setBusy(true);
    try {
      const pr = await createPull(teamId, { title: v.title.trim(), description: v.description.trim(), commitIds: v.commitIds, reviewerIds: v.reviewerIds, taskId: Number(v.taskId) });
      toast(`PR #${pr.id}을(를) 만들었어요. 리뷰어에게 리뷰를 요청했어요.`);
      onCreated(pr);
    } catch (err) { setServerErr(err.message); setBusy(false); }
  };

  return (
    <Modal title='새 PR 만들기' icon='pr' onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate>
        {serverErr && <div className='alert' role='alert'><Icon name='x' />{serverErr}</div>}
        <Field id='pr-title' label='제목' required maxLength={100} placeholder='예: 로그인 API 명세 초안' value={v.title} error={errs.title} onChange={(e) => setV({ ...v, title: e.target.value })} />
        <Field id='pr-desc' label='설명' optional as='textarea' rows={2} placeholder='어떤 변경인지 적어 주세요' value={v.description} onChange={(e) => setV({ ...v, description: e.target.value })} />

        <div className='field'>
          <span className='lbl'>포함할 커밋 <span className='req'>1개 이상</span></span>
          <ListState loading={commits.loading} error={commits.error} onRetry={() => commits.reload()}
            empty={commits.data && !myFree.length} emptyText='PR에 넣을 수 있는 내 커밋이 없어요. 먼저 파일을 올려 커밋을 만들어 주세요.'>
            <div className='pick' role='group' aria-label='포함할 커밋'>
              {myFree.map((c) => (
                <CheckItem key={c.id} checked={v.commitIds.includes(c.id)} onToggle={() => handleToggle('commitIds', c.id)}>
                  <Icon name='commit' /><span className='grow'>{c.message}</span><span className='size'>{formatDate(c.createdAt)}</span><span className='id'>{c.hash}</span>
                </CheckItem>
              ))}
            </div>
          </ListState>
          <p className='sub-hint' style={{ marginTop: 6 }}>내가 만든 커밋 중 아직 PR에 연결되지 않은 것만 보여요.</p>
          <FieldError>{errs.commits}</FieldError>
        </div>

        <div className='field'>
          <span className='lbl'>리뷰어 <span className='req'>1명 이상</span></span>
          <div className='pick' role='group' aria-label='리뷰어'>
            {reviewers.map((m) => (
              <CheckItem key={m.id} checked={v.reviewerIds.includes(m.id)} onToggle={() => handleToggle('reviewerIds', m.id)}>
                <Who user={m} /><span className='grow size'>{m.email}</span>
              </CheckItem>
            ))}
            {!reviewers.length && <p className='empty-note'>본인 말고 다른 팀원이 없어요. 팀원을 먼저 추가해 주세요.</p>}
          </div>
          <FieldError>{errs.reviewers}</FieldError>
        </div>

        <Field id='pr-task' label='연결할 Task' required as='select' value={v.taskId} error={errs.task} onChange={(e) => setV({ ...v, taskId: e.target.value })}>
          <option value=''>{tasks.loading ? '불러오는 중…' : 'Task를 골라 주세요'}</option>
          {(tasks.data || []).map((t) => <option key={t.id} value={String(t.id)}>[{t.status}] {t.title}</option>)}
        </Field>

        <div className='foot'>
          <span className='hint muted'>만들면 바로 "리뷰 대기"가 돼요.</span>
          <button className='btn' type='button' onClick={onClose}>취소</button>
          <button className='btn btn-ink' type='submit' disabled={busy}>{busy ? '만드는 중…' : 'PR 만들기'}</button>
        </div>
      </form>
    </Modal>
  );
}
