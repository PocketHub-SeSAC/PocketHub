'use client';
/* [담당 5] PR 상세 (오른쪽) — API-031(PR) + API-035(리뷰) */

/* - 승인·거부: 작성자가 아닌 팀원, 리뷰 대기일 때만 (리뷰어 지정은 백엔드에 아직 없음). 거부는 사유 필수(PR 의 reply 로 남음)
   - 수정·삭제: 작성자 본인, 리뷰 대기일 때만
   - 승인 → 연결 Task DONE (Task 가 삭제됐으면 PR 만 승인)
   - 연결 Task 가 삭제되면 경고를 보이고, 작성자는 [Task 다시 연결]로 같은 팀 Task 를 다시 고른다
   - 리뷰(의견): 리뷰어 지정 없이 PR 작성자를 뺀 팀원 누구나 작성, 작성자는 읽기만. 내가 쓴 리뷰만 수정·삭제.
     승인·거부로 처리된 PR 은 리뷰 작성·수정·삭제 불가(읽기만) */
import { useState } from 'react';
import Link from 'next/link';
import { getPull, getReviews, createReview, updateReview, deleteReview, approvePull, rejectPull, canDecidePull, canEditPull, canReviewPull, REVIEWS_ENABLED } from '@/services/pulls';
import useAsync from '@/hooks/useAsync';
import ListState from '@/components/common/ListState';
import Icon from '@/components/common/Icon';
import Who, { fillProfile } from '@/components/common/Who';
import { useTeam } from '@/components/team/TeamShell';
import ReviewItem from '@/components/review/ReviewItem';
import RejectModal from './RejectModal';
import { EditPullModal, DeletePullModal, TaskPullModal } from './PullEditModals';
import { useToast } from '@/components/common/Toast';
import { formatDate, formatSize } from '@/utils/format';

export const STATUS = { waiting: ['리뷰 대기', 'badge wait', 'st-wait'], approved: ['승인', 'badge ok', 'st-ok'], closed: ['종료', 'badge end', 'st-end'] };
const ACTION = { ADD: ['+ 추가', 'chg add'], MODIFY: ['~ 수정', 'chg'], DELETE: ['− 삭제', 'chg del'] };

export default function PullDetail({ teamId, prId, me, rejectOpen, setRejectOpen, onChanged, onDeleted }) {
  const toast = useToast();
  const { members } = useTeam();
  const who = (u) => fillProfile(members, u);
  const pr = useAsync(() => getPull(teamId, prId), [teamId, prId]);
  const reviews = useAsync(REVIEWS_ENABLED ? () => getReviews(teamId, prId) : null, [teamId, prId]);
  const [text, setText] = useState('');
  const [writeErr, setWriteErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);

  const refresh = () => { pr.reload(true); reviews.reload(true); onChanged(); };
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) { setWriteErr('리뷰 내용을 입력해 주세요.'); return; }
    setBusy(true);
    try { await createReview(teamId, prId, { content: text.trim() }); setText(''); setWriteErr(''); toast('리뷰를 남겼어요.'); reviews.reload(true); onChanged(); }
    catch (err) { setWriteErr(err.message); } finally { setBusy(false); }
  };
  const handleApprove = async () => {
    setBusy(true);
    try {
      const done = await approvePull(teamId, prId);
      // Task 가 삭제된 PR 은 PR 만 승인되고 Task 는 바뀌지 않는다
      toast(done.task ? 'PR을 승인했어요. 연결된 Task가 DONE이 됐어요.' : 'PR을 승인했어요.');
      refresh();
    }
    catch (err) { toast(err.message); } finally { setBusy(false); }
  };
  const handleReject = async (reason) => {
    await rejectPull(teamId, prId, { reason });
    setRejectOpen(false);
    toast('PR을 거부했어요.');
    refresh();
  };

  const p = pr.data;
  if (!p) {
    return <div className='pr-detail panel'><div className='pad'><ListState loading={pr.loading} error={pr.error} onRetry={() => pr.reload()} /></div></div>;
  }
  const isMine = p.author?.id === me.id;
  const canDecide = canDecidePull(p, me);
  const canEdit = canEditPull(p, me);
  const canReview = canReviewPull(p, me);
  const [label, badgeCls, stCls] = STATUS[p.status];

  return (
    <article className={`pr pr-detail ${stCls}`} aria-label={`PR #${p.id} 상세`}>
      <div className='head'>
        <span className='no'>#{p.id}</span>
        <h3>{p.title}</h3>
        <span className={badgeCls}>{label}</span>
        <div className='pr-meta'>
          <span><span className='k'>작성자</span><Who user={who(p.author)} me={isMine} /></span>
          <span><span className='k'>Task</span>{p.task ? <Link className='chip' href={`/teams/${teamId}/tasks?task=${p.task.id}`}><Icon name='task' size={12} />{p.task.title}</Link> : <span className='muted'>삭제된 Task</span>}</span>
          <span className='muted'>{formatDate(p.createdAt)}</span>
          {canEdit && (
            <span>
              <button className='btn btn-sm' type='button' onClick={() => setEditOpen(true)}>수정</button>{' '}
              <button className='btn btn-sm btn-no' type='button' onClick={() => setDeleteOpen(true)}><Icon name='trash' size={12} />삭제</button>
            </span>
          )}
        </div>
      </div>
      <div className='pr-body'>
        {/* 거부 사유는 상세 맨 위에 강조 (공통 CSS 를 건드리지 않으려고 .alert + 인라인 배치만 조정) */}
        {p.status === 'closed' && p.reply && (
          <div className='alert' role='note' aria-label='거부 사유' style={{ alignItems: 'flex-start' }}>
            <Icon name='x' />
            <div style={{ display: 'grid', gap: 6, minWidth: 0 }}>
              <span style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                <span>거부 사유</span>
                <Who user={who(p.decidedBy)} me={p.decidedBy?.id === me.id} />
                {p.decidedAt && <span style={{ fontWeight: 400 }}>{formatDate(p.decidedAt)}</span>}
              </span>
              <p style={{ margin: 0, fontWeight: 400, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{p.reply}</p>
              {isMine && <span style={{ fontWeight: 400 }}>사유를 반영해 새 PR을 올려 주세요.</span>}
            </div>
          </div>
        )}
        {!p.task && p.status === 'waiting' && (
          <div className='alert' role='status'>
            <Icon name='task' />
            {canEdit
              ? '연결된 Task가 삭제됐어요. 아래 [Task 다시 연결]로 Task를 골라 주세요.'
              : '연결된 Task가 삭제됐어요. 지금 승인하면 PR만 승인되고 Task 상태는 바뀌지 않아요. 작성자가 Task를 다시 연결할 수 있어요.'}
          </div>
        )}
        <section className='sec'>
          <div className='sec-label'><Icon name='file' />PR 내용</div>
          <dl className='rows'>
            <dt>설명</dt><dd><div className='desc'>{p.description || <span className='muted'>설명이 없어요.</span>}</div></dd>
            <dt>연결된 Task</dt>
            <dd>
              {p.task ? (
                <>
                  <Link className='chip' href={`/teams/${teamId}/tasks?task=${p.task.id}`}><Icon name='task' size={12} />{p.task.title}</Link> <span className='badge'>{p.task.status}</span>
                  {canEdit && <> <button className='btn btn-sm' type='button' onClick={() => setTaskOpen(true)}>변경</button></>}
                </>
              ) : (
                <>
                  <span className='muted'>연결된 Task가 삭제됐어요.</span>
                  {canEdit && <> <button className='btn btn-sm btn-ink' type='button' onClick={() => setTaskOpen(true)}><Icon name='task' size={12} />Task 다시 연결</button></>}
                </>
              )}
            </dd>
            <dt>포함된 Commit</dt>
            <dd>
              <ul className='items'>
                {p.commits.map((c) => (
                  <li key={c.id} className='item'>
                    <Icon name='commit' />
                    <Link className='grow' href={`/teams/${teamId}/commits?commit=${c.id}`}>{c.message}</Link>
                    <Who user={who(c.author)} me={c.author?.id === me.id} />
                    <span className='id'>{c.hash}</span>
                  </li>
                ))}
              </ul>
            </dd>
            <dt>파일</dt>
            <dd>
              {p.files.length ? (
                <ul className='items'>
                  {p.files.map((f, i) => (
                    <li key={`${f.fileId}-${i}`} className='item'>
                      <Icon name='file' /><span className='grow'>{f.name} {f.version > 1 && <span className='badge ver'>v{f.version}</span>} <span className='size'>{formatSize(f.size)}</span></span>
                      <span className={ACTION[f.action][1]}>{ACTION[f.action][0]}</span>
                    </li>
                  ))}
                </ul>
              ) : <span className='muted'>변경된 파일이 없어요.</span>}
              <p className='sub-hint' style={{ marginTop: 6 }}>파일은 커밋 상세에서 그 버전으로 내려받을 수 있어요.</p>
            </dd>
          </dl>
        </section>

        <section className='sec'>
          <div className='sec-label'><Icon name='review' size={14} />{REVIEWS_ENABLED ? '리뷰' : '리뷰 결과'}</div>
          {REVIEWS_ENABLED && (
            <>
              <ListState loading={reviews.loading} error={reviews.error} onRetry={() => reviews.reload()}
                empty={reviews.data && !reviews.data.length} emptyText={canReview ? '아직 리뷰가 없어요. 첫 의견을 남겨 보세요.' : '아직 리뷰가 없어요.'}>
                <div className='bubbles' id='bubbles'>
                  {(reviews.data || []).map((r) => (
                    <ReviewItem key={r.id} r={r} mine={p.status === 'waiting' && r.author?.id === me.id}
                      onSave={async (rv, content) => { await updateReview(teamId, prId, rv.id, { content }); toast('리뷰를 고쳤어요.'); reviews.reload(true); }}
                      onDelete={async (rv) => { try { await deleteReview(teamId, prId, rv.id); toast('리뷰를 삭제했어요.'); reviews.reload(true); onChanged(); } catch (err) { toast(err.message); } }} />
                  ))}
                </div>
              </ListState>
              {canReview ? (
              <form className='write' onSubmit={handleReviewSubmit} noValidate style={{ marginTop: 14 }}>
                <div>
                  <textarea className='input' id='review-text' rows={2} placeholder='리뷰 의견을 입력하세요' aria-label='리뷰 입력' value={text}
                    aria-invalid={writeErr ? 'true' : undefined} onChange={(e) => { setText(e.target.value); setWriteErr(''); }} />
                  {writeErr && <p className='field-err' role='alert'>{writeErr}</p>}
                </div>
                <button className='btn' type='submit' disabled={busy}><Icon name='review' size={12} />리뷰 등록</button>
              </form>
              ) : (
                <p className='sub-hint' style={{ marginTop: 14 }}>
                  {p.status !== 'waiting' ? '처리된 PR이라 리뷰를 남기거나 고칠 수 없어요.' : '내가 만든 PR이라 리뷰는 다른 팀원이 남겨요.'}
                </p>
              )}
            </>
          )}

          <div className='actions'>
            {canDecide && (
              <>
                <button className='btn btn-ok' type='button' onClick={handleApprove} disabled={busy}><Icon name='check' />승인</button>
                <button className='btn btn-no' type='button' onClick={() => setRejectOpen(true)} disabled={busy}><Icon name='x' />거부</button>
                <span className='hint muted'>팀원 중 1명이 결정하면 바로 확정돼요.</span>
              </>
            )}
            {p.status === 'waiting' && isMine && (
              <span className='hint muted'>내가 만든 PR이라 다른 팀원의 승인·거부를 기다리고 있어요.</span>
            )}
            {p.status === 'approved' && <span className='stamp'><Icon name='check' />승인됨<Who user={who(p.decidedBy)} me={p.decidedBy?.id === me.id} />{p.decidedAt && <span>{formatDate(p.decidedAt)}</span>}</span>}
            {p.status === 'closed' && <span className='stamp end'><Icon name='x' />거부됨 · 종료<Who user={who(p.decidedBy)} me={p.decidedBy?.id === me.id} />{p.decidedAt && <span>{formatDate(p.decidedAt)}</span>}</span>}
          </div>
          {p.status === 'approved' && p.task && <p className='note-line'><Icon name='task' size={12} />연결된 Task({p.task.title})가 DONE으로 옮겨졌어요.</p>}
          {p.status === 'closed' && p.reply && (
            <p className='note-line'><Icon name='review' size={12} />거부 사유는 PR 상세 맨 위에서 볼 수 있어요.</p>
          )}
        </section>
      </div>
      {rejectOpen && canDecide && <RejectModal onClose={() => setRejectOpen(false)} onSubmit={handleReject} />}
      {editOpen && canEdit && <EditPullModal teamId={teamId} pr={p} onClose={() => setEditOpen(false)} onSaved={() => { setEditOpen(false); refresh(); }} />}
      {taskOpen && canEdit && <TaskPullModal teamId={teamId} pr={p} onClose={() => setTaskOpen(false)} onSaved={() => { setTaskOpen(false); refresh(); }} />}
      {deleteOpen && canEdit && <DeletePullModal teamId={teamId} pr={p} onClose={() => setDeleteOpen(false)} onDeleted={() => { setDeleteOpen(false); onDeleted(); }} />}
    </article>
  );
}
