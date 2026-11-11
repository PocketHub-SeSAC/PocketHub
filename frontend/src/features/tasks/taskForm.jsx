/* [담당 4] Task 입력칸 묶음 — 생성 모달과 상세 패널이 함께 쓴다
   우선순위 높음/보통/낮음, 담당자 팀원 1명 또는 비움, 작업일·마감일 선택(마감일 ≥ 작업일) */
import Field from '../../components/Field';

export const STATUS_LABEL = { TODO: 'TODO', DOING: 'DOING', DONE: 'DONE' };
export const PRIORITIES = [['HIGH', '높음'], ['MEDIUM', '보통'], ['LOW', '낮음']];
export const PRIORITY_LABEL = Object.fromEntries(PRIORITIES);
export const PRIORITY_CLASS = { HIGH: 'pri-hi', MEDIUM: '', LOW: 'pri-low' };

export const emptyTask = () => ({ title: '', description: '', priority: 'MEDIUM', assigneeId: '', startDate: '', dueDate: '' });
export const fromTask = (t) => ({
  title: t.title, description: t.description, priority: t.priority,
  assigneeId: t.assignee ? String(t.assignee.id) : '', startDate: t.startDate || '', dueDate: t.dueDate || '',
});
export const toApiTask = (v) => ({ ...v, title: v.title.trim(), description: v.description.trim(), assigneeId: v.assigneeId ? Number(v.assigneeId) : null });

export function validateTask(v) {
  const e = {};
  const title = v.title.trim();
  if (!title) e.title = 'Task 제목을 입력해 주세요.';
  else if (title.length > 100) e.title = 'Task 제목은 100자 이하로 입력해 주세요.';
  if (v.startDate && v.dueDate && v.dueDate < v.startDate) e.dueDate = '마감일은 작업일보다 빠를 수 없어요.';
  return e;
}

export function TaskFields({ idPrefix, v, setV, errs, members }) {
  const set = (k) => (e) => setV({ ...v, [k]: e.target.value });
  return (
    <>
      <Field id={`${idPrefix}-title`} label="제목" required maxLength={100} placeholder="무엇을 할까요?" value={v.title} error={errs.title} onChange={set('title')} />
      <Field id={`${idPrefix}-desc`} label="설명" optional as="textarea" rows={2} placeholder="자세한 내용" value={v.description} onChange={set('description')} />
      <Field id={`${idPrefix}-assignee`} label="담당자" as="select" value={v.assigneeId} onChange={set('assigneeId')}>
        <option value="">담당자 없음</option>
        {members.map((m) => <option key={m.id} value={String(m.id)}>{m.nickname}</option>)}
      </Field>
      <div className="row2c">
        <Field id={`${idPrefix}-start`} label="작업일" optional type="date" value={v.startDate} onChange={set('startDate')} />
        <Field id={`${idPrefix}-due`} label="마감일" optional type="date" min={v.startDate || undefined} value={v.dueDate} error={errs.dueDate} onChange={set('dueDate')} />
      </div>
      <div className="field">
        <span className="lbl" id={`${idPrefix}-pri-label`}>우선순위</span>
        <div className="seg" role="group" aria-labelledby={`${idPrefix}-pri-label`}>
          {PRIORITIES.map(([k, label]) => (
            <button key={k} type="button" aria-pressed={v.priority === k} onClick={() => setV({ ...v, priority: k })}>{label}</button>
          ))}
        </div>
      </div>
    </>
  );
}
