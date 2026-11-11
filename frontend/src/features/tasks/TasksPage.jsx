/* [담당 4] 태스크 보드 — /teams/:teamId/tasks  ?modal=new-task  ?task=:taskId(&modal=delete-task)
   TODO / DOING / DONE 칸반. 포스트잇을 끌어다 놓으면 상태 변경(API-026).
   팀원 누구나 생성·수정·삭제·상태 변경. 제목이 길면 2줄로 줄이고, 마우스를 올리면 전체를 겹쳐 보여준다. */
import { useRef, useState } from 'react';
import { getTasks, updateTaskStatus, getTaskPulls } from '../../api/tasks';
import { Modal } from '../../components/Modal';
import { useTeam } from '../../layouts/TeamLayout';
import useAsync from '../../hooks/useAsync';
import useQuery from '../../hooks/useQuery';
import ListState from '../../components/ListState';
import Icon from '../../components/Icon';
import Who from '../../components/Who';
import { useToast } from '../../components/Toast';
import { shortDay } from '../../utils/format';
import { STATUS_LABEL, PRIORITY_LABEL, PRIORITY_CLASS } from './taskForm';
import { NewTaskModal, TaskSide, DeleteTaskModal } from './TaskPanels';

const COLS = ['TODO', 'DOING', 'DONE'];

function Note({ t, selected, onOpen, onDragStart, onDragEnd, onHover, pop = false, style }) {
  return (
    <a className={`pn n-${t.status.toLowerCase()} ${selected ? 'sel' : ''} ${pop ? 'pn-pop' : ''}`} style={style}
      href={pop ? undefined : `?task=${t.id}`} draggable={!pop} aria-label={pop ? undefined : `${t.title} (${STATUS_LABEL[t.status]})`}
      onClick={pop ? undefined : (e) => { e.preventDefault(); onOpen(t); }}
      onDragStart={pop ? undefined : (e) => onDragStart(e, t)} onDragEnd={pop ? undefined : onDragEnd}
      onMouseEnter={pop ? undefined : (e) => onHover(e, t)} onMouseLeave={pop ? undefined : () => onHover(null)}>
      <h4>{t.title}</h4>
      <div className="meta">
        <Who user={t.assignee} emptyText="담당자 없음" />
        {t.dueDate && <span>~ {shortDay(t.dueDate)}</span>}
        <span className={`badge ${PRIORITY_CLASS[t.priority]}`}>{PRIORITY_LABEL[t.priority]}</span>
        {t.pullCount > 0 && <span className="badge"><Icon name="pr" />PR {t.pullCount}</span>}
      </div>
    </a>
  );
}

export default function TasksPage() {
  const { teamId, members } = useTeam();
  const [q, setQuery] = useQuery();
  const toast = useToast();
  const tasks = useAsync(() => getTasks(teamId), [teamId]);
  const [version, setVersion] = useState(0);
  const [overCol, setOverCol] = useState(null);
  const [pop, setPop] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const dragging = useRef(null);
  const taskId = q.get('task');
  const modal = q.get('modal');
  const list = tasks.data || [];
  const selected = list.find((t) => String(t.id) === taskId);
  const refresh = () => { tasks.reload(true); setVersion((x) => x + 1); };

  /* 상태 변경은 방향 제한 없음(TODO ↔ DOING ↔ DONE). 드래그와 상세 패널 모두 여기로 → API-026 하나로 처리 */
  const applyStatus = async (t, status) => {
    const prev = t.status;
    tasks.setData((arr) => arr.map((x) => (x.id === t.id ? { ...x, status } : x)));  // 먼저 옮겨 보이고
    try {
      await updateTaskStatus(teamId, t.id, status);
      toast(`${STATUS_LABEL[status]}(으)로 옮겼어요.`);
      refresh();
    } catch (err) {
      tasks.setData((arr) => arr.map((x) => (x.id === t.id ? { ...x, status: prev } : x)));  // 실패하면 되돌림
      toast(err.message);
    }
  };
  // PR 승인으로 DONE 이 된 Task 를 되돌릴 때만 한 번 확인한다
  const move = async (t, status) => {
    if (!t || t.status === status) return;
    if (t.status === 'DONE' && t.pullCount > 0) {
      try {
        const prs = await getTaskPulls(teamId, t.id);
        if (prs.some((p) => p.status === 'approved')) { setConfirm({ t, status }); return; }
      } catch { /* 확인 못 하면 그냥 진행 */ }
    }
    applyStatus(t, status);
  };

  const onHover = (e, t) => {
    if (!e || dragging.current) { setPop(null); return; }
    const h4 = e.currentTarget.querySelector('h4');
    if (h4.scrollHeight <= h4.clientHeight + 1) { setPop(null); return; }
    const r = e.currentTarget.getBoundingClientRect();
    setPop({ t, style: { left: r.left, top: r.top, width: r.width } });
  };

  return (
    <>
      <div className="pagehead">
        <div><h2 className="ko">태스크 보드</h2><p className="muted">할 일을 포스트잇으로 붙이고, 끌어다 놓아 상태를 옮겨요. 카드를 누르면 상세가 열려요.</p></div>
        <button className="btn btn-ink" type="button" onClick={() => setQuery({ modal: 'new-task' })}><Icon name="plus" />Task 생성</button>
      </div>

      <ListState loading={tasks.loading} error={tasks.error} onRetry={() => tasks.reload()}
        empty={tasks.data && !tasks.data.length && !taskId} emptyText="아직 Task가 없어요. 첫 Task를 만들어 보세요."
        emptyAction={<button className="btn btn-sm" type="button" onClick={() => setQuery({ modal: 'new-task' })}><Icon name="plus" />Task 생성</button>}>
        <div className={`split ${taskId ? 'has-side' : ''}`}>
          <div className="cols">
            {COLS.map((st) => {
              const items = list.filter((t) => t.status === st);
              return (
                <div key={st} className="col">
                  <div className="col-head"><span>{STATUS_LABEL[st]}</span><span className="cnt" aria-label={`${items.length}개`}>{items.length}</span></div>
                  <div className={`col-body ${overCol === st ? 'over' : ''}`} id={`col-${st.toLowerCase()}`}
                    onDragOver={(e) => { if (dragging.current) { e.preventDefault(); setOverCol(st); } }}
                    onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setOverCol(null); }}
                    onDrop={(e) => { e.preventDefault(); setOverCol(null); move(dragging.current, st); dragging.current = null; }}>
                    {items.map((t) => (
                      <Note key={t.id} t={t} selected={String(t.id) === taskId}
                        onOpen={(x) => setQuery({ task: x.id, modal: null })}
                        onDragStart={(e, x) => { dragging.current = x; setPop(null); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', x.title); }}
                        onDragEnd={() => { dragging.current = null; setOverCol(null); }}
                        onHover={onHover} />
                    ))}
                    {!items.length && <p className="sub-hint" style={{ textAlign: 'center' }}>여기로 끌어다 놓을 수 있어요</p>}
                  </div>
                </div>
              );
            })}
          </div>
          {taskId && (
            <TaskSide key={taskId} teamId={teamId} taskId={taskId} members={members} version={version}
              onClose={() => setQuery({ task: null, modal: null })} onChanged={refresh} onStatus={move}
              onDelete={() => setQuery({ modal: 'delete-task' })} />
          )}
        </div>
      </ListState>

      {pop && <Note t={pop.t} pop style={pop.style} />}

      {confirm && (
        <Modal title="상태 변경 확인" icon="task" onClose={() => setConfirm(null)} size="sm" label="상태 변경 확인">
          <div className="fields">
            <p>승인된 PR이 연결된 Task예요. 상태를 바꿀까요?</p>
            <p className="sub-hint">"{confirm.t.title}" : DONE → {STATUS_LABEL[confirm.status]}</p>
            <div className="foot">
              <button className="btn" type="button" onClick={() => setConfirm(null)}>취소</button>
              <button className="btn btn-ink" type="button" onClick={() => { const c = confirm; setConfirm(null); applyStatus(c.t, c.status); }}>바꾸기</button>
            </div>
          </div>
        </Modal>
      )}

      {modal === 'new-task' && (
        <NewTaskModal teamId={teamId} members={members} onClose={() => setQuery({ modal: null })}
          onCreated={() => { setQuery({ modal: null }); refresh(); }} />
      )}
      {modal === 'delete-task' && selected && (
        <DeleteTaskModal teamId={teamId} task={selected} onClose={() => setQuery({ modal: null })}
          onDeleted={() => { setQuery({ modal: null, task: null }); refresh(); }} />
      )}
    </>
  );
}
