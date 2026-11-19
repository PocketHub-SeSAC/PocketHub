/* [담당 4] 목업: Task */

/* 팀원 누구나 생성·수정·삭제·상태 변경. 새 Task 는 TODO.
   startDate 는 요청으로 받지 않고 생성한 날(YYYY-MM-DD)로 정한다. 수정해도 바뀌지 않는다.
   마감일은 startDate(생성일)보다 빠를 수 없다. 담당자는 팀원 1명 또는 비움. */
import { nextId } from '@/mocks/db';
import { fail, ok, created, noContent, publicUser, requireMember, isMember, str, toId, now } from '@/mocks/util';
import { pullSummary } from './pulls';

const STATUSES = ['TODO', 'DOING', 'DONE'];
const PRIORITIES = ['HIGH', 'MEDIUM', 'LOW'];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** 날짜 → 로컬 기준 YYYY-MM-DD */
const ymd = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
/** startDate 가 비어 있는 예전 데이터는 생성일로 본다 */
const startOf = (t) => t.startDate || (t.createdAt ? ymd(t.createdAt) : '');

export const taskView = (db, t) => ({
  id: t.id, title: t.title, description: t.description, status: t.status, priority: t.priority,
  assignee: t.assigneeId ? publicUser(db, t.assigneeId) : null,
  startDate: startOf(t), dueDate: t.dueDate || '',
  pullCount: db.pulls.filter((p) => p.taskId === t.id).length,
  createdAt: t.createdAt,
});

/** startDate: 그 Task 의 시작일(생성일). 요청 본문의 startDate 는 읽지 않는다 */
function validTaskInput(db, team, body, startDate) {
  const title = str(body?.title);
  const description = str(body?.description);
  const priority = String(body?.priority || 'MEDIUM').toUpperCase();
  const dueDate = body?.dueDate || '';
  const assigneeId = body?.assigneeId === null || body?.assigneeId === undefined || body?.assigneeId === '' ? null : toId(body.assigneeId);
  if (!title) fail(400, 'Task 제목을 입력해 주세요.');
  if (title.length > 100) fail(400, 'Task 제목은 100자 이하로 입력해 주세요.');
  if (!PRIORITIES.includes(priority)) fail(400, '우선순위는 높음·보통·낮음 중에서 골라 주세요.');
  if (dueDate && !DATE_RE.test(dueDate)) fail(400, '마감일 형식이 올바르지 않아요.');
  if (startDate && dueDate && dueDate < startDate) fail(400, '마감일은 작업일보다 빠를 수 없어요.');
  if (assigneeId !== null && !isMember(db, team.id, assigneeId)) fail(400, '담당자는 이 팀의 팀원 중에서 골라 주세요.');
  return { title, description, priority, dueDate, assigneeId };
}

function findTask(db, team, taskId) {
  const t = db.tasks.find((x) => x.id === toId(taskId) && x.teamId === team.id);
  if (!t) fail(404, '찾을 수 없습니다.');
  return t;
}

export const handlers = {
  'tasks.create': ({ db, user, params, body }) => {
    const team = requireMember(db, params.teamId, user);
    const createdAt = now();
    const startDate = ymd(createdAt);  // 시작일 = 생성한 날
    const input = validTaskInput(db, team, body, startDate);
    const t = { id: nextId(db, 'task'), teamId: team.id, status: 'TODO', createdAt, startDate, ...input };
    db.tasks.push(t);
    return created(taskView(db, t));
  },

  'tasks.list': ({ db, user, params }) => {
    const team = requireMember(db, params.teamId, user);
    return ok(db.tasks.filter((t) => t.teamId === team.id).map((t) => taskView(db, t)));
  },

  'tasks.detail': ({ db, user, params }) => {
    const team = requireMember(db, params.teamId, user);
    return ok(taskView(db, findTask(db, team, params.taskId)));
  },

  'tasks.update': ({ db, user, params, body }) => {
    const team = requireMember(db, params.teamId, user);
    const t = findTask(db, team, params.taskId);
    Object.assign(t, validTaskInput(db, team, body, startOf(t)));  // startDate 는 그대로 둔다
    return ok(taskView(db, t));
  },

  'tasks.updateStatus': ({ db, user, params, body }) => {
    const team = requireMember(db, params.teamId, user);
    const t = findTask(db, team, params.taskId);
    const status = String(body?.status || '').toUpperCase();
    if (!STATUSES.includes(status)) fail(400, '상태는 TODO·DOING·DONE 중 하나여야 해요.');
    t.status = status;
    return ok(taskView(db, t));
  },

  'tasks.remove': ({ db, user, params }) => {
    const team = requireMember(db, params.teamId, user);
    const t = findTask(db, team, params.taskId);
    db.tasks = db.tasks.filter((x) => x.id !== t.id);
    return noContent();
  },

  'tasks.pulls': ({ db, user, params }) => {
    const team = requireMember(db, params.teamId, user);
    const t = findTask(db, team, params.taskId);
    return ok(db.pulls.filter((p) => p.taskId === t.id).sort((a, b) => b.id - a.id).map((p) => pullSummary(db, p)));
  },
};
