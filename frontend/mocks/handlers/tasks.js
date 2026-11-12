/* [담당 4] 목업: Task */

/* 팀원 누구나 생성·수정·삭제·상태 변경. 새 Task 는 TODO.
   마감일은 작업일보다 빠를 수 없다. 담당자는 팀원 1명 또는 비움. */
import { nextId } from '@/mocks/db';
import { fail, ok, created, noContent, publicUser, requireMember, isMember, str, toId, now } from '@/mocks/util';
import { pullSummary } from './pulls';

const STATUSES = ['TODO', 'DOING', 'DONE'];
const PRIORITIES = ['HIGH', 'MEDIUM', 'LOW'];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const taskView = (db, t) => ({
  id: t.id, title: t.title, description: t.description, status: t.status, priority: t.priority,
  assignee: t.assigneeId ? publicUser(db, t.assigneeId) : null,
  startDate: t.startDate || '', dueDate: t.dueDate || '',
  pullCount: db.pulls.filter((p) => p.taskId === t.id).length,
  createdAt: t.createdAt,
});

function validTaskInput(db, team, body) {
  const title = str(body?.title);
  const description = str(body?.description);
  const priority = String(body?.priority || 'MEDIUM').toUpperCase();
  const startDate = body?.startDate || '';
  const dueDate = body?.dueDate || '';
  const assigneeId = body?.assigneeId === null || body?.assigneeId === undefined || body?.assigneeId === '' ? null : toId(body.assigneeId);
  if (!title) fail(400, 'Task 제목을 입력해 주세요.');
  if (title.length > 100) fail(400, 'Task 제목은 100자 이하로 입력해 주세요.');
  if (!PRIORITIES.includes(priority)) fail(400, '우선순위는 높음·보통·낮음 중에서 골라 주세요.');
  if (startDate && !DATE_RE.test(startDate)) fail(400, '작업일 형식이 올바르지 않아요.');
  if (dueDate && !DATE_RE.test(dueDate)) fail(400, '마감일 형식이 올바르지 않아요.');
  if (startDate && dueDate && dueDate < startDate) fail(400, '마감일은 작업일보다 빠를 수 없어요.');
  if (assigneeId !== null && !isMember(db, team.id, assigneeId)) fail(400, '담당자는 이 팀의 팀원 중에서 골라 주세요.');
  return { title, description, priority, startDate, dueDate, assigneeId };
}

function findTask(db, team, taskId) {
  const t = db.tasks.find((x) => x.id === toId(taskId) && x.teamId === team.id);
  if (!t) fail(404, '찾을 수 없습니다.');
  return t;
}

export const handlers = {
  'tasks.create': ({ db, user, params, body }) => {
    const team = requireMember(db, params.teamId, user);
    const input = validTaskInput(db, team, body);
    const t = { id: nextId(db, 'task'), teamId: team.id, status: 'TODO', createdAt: now(), ...input };
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
    Object.assign(t, validTaskInput(db, team, body));
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
