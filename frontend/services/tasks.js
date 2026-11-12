/* [담당 4] Task API (API-022 ~ 028) */
import { request } from './client';
import { normalizeTask, normalizeTasks, normalizePulls } from './adapter';

export const TASKS_API = {
  create:       { key: 'tasks.create',       method: 'POST',   path: '/api/v1/teams/{teamId}/tasks' },                   // API-022
  list:         { key: 'tasks.list',         method: 'GET',    path: '/api/v1/teams/{teamId}/tasks' },                   // API-023
  detail:       { key: 'tasks.detail',       method: 'GET',    path: '/api/v1/teams/{teamId}/tasks/{taskId}' },          // API-024
  update:       { key: 'tasks.update',       method: 'PATCH',  path: '/api/v1/teams/{teamId}/tasks/{taskId}' },          // API-025
  updateStatus: { key: 'tasks.updateStatus', method: 'PATCH',  path: '/api/v1/teams/{teamId}/tasks/{taskId}/status' },   // API-026
  remove:       { key: 'tasks.remove',       method: 'DELETE', path: '/api/v1/teams/{teamId}/tasks/{taskId}' },          // API-027
  pulls:        { key: 'tasks.pulls',        method: 'GET',    path: '/api/v1/teams/{teamId}/tasks/{taskId}/pulls' },    // API-028
};

/** 화면에서 쓰는 입력값 → 요청 본문 (assigneeId 가 null 이면 담당자 없음) */
const toBody = (t) => ({
  title: t.title,
  description: t.description || '',
  priority: t.priority,
  assigneeId: t.assigneeId ?? null,
  startDate: t.startDate || null,
  dueDate: t.dueDate || null,
});

export const createTask = (teamId, task) =>
  request(TASKS_API.create, { params: { teamId }, body: toBody(task) }).then(normalizeTask);

export const getTasks = (teamId) => request(TASKS_API.list, { params: { teamId } }).then(normalizeTasks);

export const getTask = (teamId, taskId) =>
  request(TASKS_API.detail, { params: { teamId, taskId }, handle404: false }).then(normalizeTask);

export const updateTask = (teamId, taskId, task) =>
  request(TASKS_API.update, { params: { teamId, taskId }, body: toBody(task) }).then(normalizeTask);

/** status: 'TODO' | 'DOING' | 'DONE' */
export const updateTaskStatus = (teamId, taskId, status) =>
  request(TASKS_API.updateStatus, { params: { teamId, taskId }, body: { status } }).then(normalizeTask);

export const deleteTask = (teamId, taskId) => request(TASKS_API.remove, { params: { teamId, taskId } });

export const getTaskPulls = (teamId, taskId) =>
  request(TASKS_API.pulls, { params: { teamId, taskId }, handle404: false }).then(normalizePulls);
