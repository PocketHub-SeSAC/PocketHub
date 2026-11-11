/* [담당 5] PR 상세 (오른쪽) — API-031(PR) + API-035(리뷰)
   - 리뷰(의견)는 팀원 누구나 작성. 내가 쓴 리뷰만 수정·삭제 버튼
   - 승인·거부 버튼은 지정된 리뷰어에게만, 리뷰 대기일 때만. 거부는 사유 필수(리뷰로 남음)
   - 승인 → 연결 Task DONE / 거부 → 커밋·파일 버전이 목록에서 빠짐 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getPull, getReviews, createReview, updateReview, deleteReview, approvePull, rejectPull } from '../../api/pulls';
import useAsync from '../../hooks/useAsync';
import ListState from '../../components/ListState';
import { Modal } from '../../components/Modal';
import Field from '../../components/Field';
import Icon from '../../components/Icon';
import Who, { Avatar } from '../../components/Who';
import { useToast } from '../../components/Toast';
import { formatDate, formatDateTime, formatSize } from '../../utils/format';

export const STATUS = { waiting: ['리뷰 대기', 'badge wait', 'st-wait'], approved: ['승인', 'badge ok', 'st-ok'], closed: ['종료', 'badge end', 'st-end'] };
const ACTION = { ADD: ['추가', 'badge ok'], MODIFY: ['수정', 'badge'], DELETE: ['삭제', 'badge end'] };

function RejectModal({ onClose, onSubmit }) {
  const [reason, setReason] = useState('');
  const [err, setErr] = useState('');
  const [serverErr, setServerErr] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) { setErr('거부 사유를 입력해 주세요. 사유는 리뷰로 남아요.'); return; }
    setBusy(true); setServerErr('');
    try { await onSubmit(reason.trim()); } catch (er) { setServerErr(er.message); setBusy(false); }
  };
  return (
    <Modal title="PR 거부" icon="x" onClose={onClose} size="sm">
      <form onSubmit={submit} noValidate>
        {serverErr && <div className="alert" role="alert"><Icon name="x" />{serverErr}</div>}
        <p className="sub-hint">거부하면 PR이 종료되고, 이 PR의 커밋과 그 커밋으로 올라간 파일 버전이 목록에서 빠져요.</p>
        <Field id="reject-reason" label="거부 사유" required as="textarea" rows={3} maxLength={1000} placeholder="왜 거부하는지 알려 주세요" value={reason} error={err}
          onChange={(e) => { setReason(e.target.value); setErr(''); }} />
        <div className="foot">
          <button className="btn" type="button" onClick={onClose}>취소</button>
          <button className="btn btn-no" type="submit" disabled={busy}>{busy ? '처리 중…' : '거부'}</button>
        </div>
      </form>
    </Modal>
  );
}

function Review({ r, mine, onSave, onDelete }) {
  const [edit, setEdit] = useState(null);
  const [err, setErr] = useState('');
  const save = async () => {
    if (!edit.trim()) { setErr('리뷰 내용을 입력해 주세요.'); return; }
    try { await onSave(r, edit.trim()); setEdit(null); setErr(''); } catch (er) { setErr(er.message); }
  };
  return (
    <div className={`bubble ${r.type === 'REJECT' ? 'reject' : ''}`}>
      <Avatar user={r.author} />
      <div className="box">
        <div className="top">
          <b>{r.author?.nickname}</b>
          {r.type === 'REJECT' && <span className="badge end">거부 사유</span>}
          <span className="muted">{formatDateTime(r.createdAt)}</span>
          {mine && edit === null && (
            <span className="tools">
              <button className="linkbtn" type="button" onClick={() => setEdit(r.content)}>수정</button>
              <button className="linkbtn" type="button" onClick={() => onDelete(r)}>삭제</button>
            </span>
          )}
        </div>
        {edit === null ? r.content : (
          <div className="form" style={{ gap: 8 }}>
            <textarea className="input" rows={2} aria-label="리뷰 수정" value={edit} onChange={(e) => setEdit(e.target.value)} />
            {err && <p className="field-err">{err}</p>}
            <div className="rowbtns">
              <button className="btn btn-sm btn-ink" type="button" onClick={save}>저장</button>
              <button className="btn btn-sm" type="button" onClick={() => { setEdit(null); setErr(''); }}>취소</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PullDetail({ teamId, prId, me, rejectOpen, setRejectOpen, onChanged }) {
  const toast = useToast();
  const pr = useAsync(() => getPull(teamId, prId), [teamId, prId]);
  const reviews = useAsync(() => getReviews(teamId, prId), [teamId, prId]);
  const [text, setText] = useState('');
  const [writeErr, setWriteErr] = useState('');
  const [busy, setBusy] = useState(false);

  const refresh = () => { pr.reload(true); reviews.reload(true); onChanged(); };
  const post = async (e) => {
    e.preventDefault();
    if (!text.trim()) { setWriteErr('리뷰 내용을 입력해 주세요.'); return; }
    setBusy(true);
    try { await createReview(teamId, prId, { content: text.trim() }); setText(''); setWriteErr(''); toast('리뷰를 남겼어요.'); reviews.reload(true); onChanged(); }
    catch (err) { setWriteErr(err.message); } finally { setBusy(false); }
  };
  const approve = async () => {
    try { await approvePull(teamId, prId); toast('PR을 승인했어요. 연결된 Task가 DONE이 됐어요.'); refresh(); }
    catch (err) { toast(err.message); }
  };
  const reject = async (reason) => {
    await rejectPull(teamId, prId, { reason });
    setRejectOpen(false);
    toast('PR을 거부했어요. 이 PR의 커밋과 파일 버전이 목록에서 빠졌어요.');
    refresh();
  };

  const p = pr.data;
  if (!p) {
    return <div className="pr-detail panel"><div className="pad"><ListState loading={pr.loading} error={pr.error} onRetry={() => pr.reload()} /></div></div>;
  }
  const isReviewer = p.reviewers.some((r) => r.id === me.id);
  const canDecide = p.status === 'waiting' && isReviewer;
  const [label, badgeCls, stCls] = STATUS[p.status];

  return (
    <article className={`pr pr-detail ${stCls}`} aria-label={`PR #${p.id} 상세`}>
      <div className="head">
        <span className="no">#{p.id}</span>
        <h3>{p.title}</h3>
        <span className={badgeCls}>{label}</span>
        <div className="pr-meta">
          <span><span className="k">작성자</span><Who user={p.author} me={p.author?.id === me.id} /></span>
          <span><span className="k">리뷰어</span>{p.reviewers.map((r) => <Who key={r.id} user={r} me={r.id === me.id} />)}</span>
          <span><span className="k">Task</span>{p.task ? <Link className="chip" to={`/teams/${teamId}/tasks?task=${p.task.id}`}><Icon name="task" size={12} />{p.task.title}</Link> : <span className="muted">삭제된 Task</span>}</span>
          <span className="muted">{formatDate(p.createdAt)}</span>
        </div>
      </div>
      <div className="pr-body">
        <section className="sec">
          <div className="sec-label"><Icon name="file" />PR 내용</div>
          <dl className="rows">
            <dt>설명</dt><dd><div className="desc">{p.description || <span className="muted">설명이 없어요.</span>}</div></dd>
            <dt>연결된 Task</dt>
            <dd>{p.task ? <><Link className="chip" to={`/teams/${teamId}/tasks?task=${p.task.id}`}><Icon name="task" size={12} />{p.task.title}</Link> <span className="badge">{p.task.status}</span></> : <span className="muted">연결된 Task가 삭제됐어요.</span>}</dd>
            <dt>포함된 Commit</dt>
            <dd>
              <ul className="items">
                {p.commits.map((c) => (
                  <li key={c.id} className="item">
                    <Icon name="commit" />
                    {p.status === 'closed'
                      ? <span className="grow">{c.message} <span className="size">(거부되어 목록에서 빠짐)</span></span>
                      : <Link className="grow" to={`/teams/${teamId}/commits?commit=${c.id}`}>{c.message}</Link>}
                    <span className="id">{c.hash}</span>
                  </li>
                ))}
              </ul>
            </dd>
            <dt>파일</dt>
            <dd>
              <ul className="items">
                {p.files.map((f, i) => (
                  <li key={`${f.fileId}-${i}`} className="item">
                    <Icon name="file" /><span className="grow">{f.name} <span className="badge ver">v{f.version}</span> <span className="size">{formatSize(f.size)}</span></span>
                    <span className={ACTION[f.action][1]}>{ACTION[f.action][0]}</span>
                  </li>
                ))}
              </ul>
              {p.status !== 'closed' && <p className="sub-hint" style={{ marginTop: 6 }}>파일은 커밋 상세에서 그 버전으로 내려받을 수 있어요.</p>}
            </dd>
          </dl>
        </section>

        <section className="sec">
          <div className="sec-label"><Icon name="review" size={14} />리뷰</div>
          <div className="reviewer"><span className="muted">지정된 리뷰어</span>{p.reviewers.map((r) => <Who key={r.id} user={r} me={r.id === me.id} />)}</div>
          <ListState loading={reviews.loading} error={reviews.error} onRetry={() => reviews.reload()}
            empty={reviews.data && !reviews.data.length} emptyText="아직 리뷰가 없어요. 첫 의견을 남겨 보세요.">
            <div className="bubbles" id="bubbles">
              {(reviews.data || []).map((r) => (
                <Review key={r.id} r={r} mine={r.author?.id === me.id}
                  onSave={async (rv, content) => { await updateReview(teamId, prId, rv.id, { content }); toast('리뷰를 고쳤어요.'); reviews.reload(true); }}
                  onDelete={async (rv) => { try { await deleteReview(teamId, prId, rv.id); toast('리뷰를 삭제했어요.'); reviews.reload(true); onChanged(); } catch (err) { toast(err.message); } }} />
              ))}
            </div>
          </ListState>
          <form className="write" onSubmit={post} noValidate style={{ marginTop: 14 }}>
            <div>
              <textarea className="input" id="review-text" rows={2} placeholder="리뷰 의견을 입력하세요" aria-label="리뷰 입력" value={text}
                aria-invalid={writeErr ? 'true' : undefined} onChange={(e) => { setText(e.target.value); setWriteErr(''); }} />
              {writeErr && <p className="field-err" role="alert">{writeErr}</p>}
            </div>
            <button className="btn" type="submit" disabled={busy}><Icon name="review" size={12} />리뷰 등록</button>
          </form>

          <div className="actions">
            {canDecide && (
              <>
                <button className="btn btn-ok" type="button" onClick={approve}><Icon name="check" />승인</button>
                <button className="btn btn-no" type="button" onClick={() => setRejectOpen(true)}><Icon name="x" />거부</button>
                <span className="hint muted">리뷰어 중 1명이 결정하면 바로 확정돼요.</span>
              </>
            )}
            {p.status === 'waiting' && !isReviewer && (
              <span className="hint muted">승인과 거부는 지정된 리뷰어({p.reviewers.map((r) => r.nickname).join(', ')})만 할 수 있어요.</span>
            )}
            {p.status === 'approved' && <span className="stamp"><Icon name="check" />승인됨{p.decidedBy ? ` · ${p.decidedBy.nickname}` : ''} · {formatDate(p.decidedAt)}</span>}
            {p.status === 'closed' && <span className="stamp end"><Icon name="x" />거부됨 · 종료{p.decidedBy ? ` · ${p.decidedBy.nickname}` : ''}</span>}
          </div>
          {p.status === 'approved' && p.task && <p className="note-line"><Icon name="task" size={12} />연결된 Task({p.task.title})가 DONE으로 옮겨졌어요.</p>}
          {p.status === 'closed' && <p className="note-line"><Icon name="commit" />거부되어 이 PR의 커밋과 파일 버전이 목록에서 빠졌어요.</p>}
        </section>
      </div>
      {rejectOpen && canDecide && <RejectModal onClose={() => setRejectOpen(false)} onSubmit={reject} />}
    </article>
  );
}
