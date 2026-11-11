/* =========================================================
   응답 어댑터: 서버 응답 형태가 정해지면 이 파일만 고친다.
   - unwrap      : 공통 응답 껍데기({ success, data, message } 등)를 벗긴다
   - toApiError  : 실패 응답을 화면에서 쓸 오류로 바꾼다
   - normalize*  : 필드 이름 차이(id / memberId, nickname / name …)를 흡수한다
   화면 코드는 normalize* 결과 모양만 믿고 쓴다.
   ========================================================= */
import { ApiError } from './errors';

export function unwrap(body) {
  if (body && typeof body === 'object' && !Array.isArray(body) && 'data' in body &&
      ('success' in body || 'status' in body || 'code' in body || 'message' in body)) {
    return body.data;
  }
  return body;
}

const DEFAULT_MESSAGES = {
  400: '입력값을 다시 확인해 주세요.',
  401: '로그인이 필요해요. 다시 로그인해 주세요.',
  403: '이 작업을 할 권한이 없어요.',
  404: '찾을 수 없습니다.',
  409: '이미 처리된 요청이에요. 화면을 새로고침해 주세요.',
  500: '서버에 문제가 생겼어요. 잠시 후 다시 시도해 주세요.',
};

export function toApiError(status, body) {
  // 404는 다른 팀·리소스가 있다는 사실을 드러내지 않도록 문구를 고정한다
  if (status === 404) return new ApiError(404, DEFAULT_MESSAGES[404], body);
  const msg = (body && (body.message || (body.error && (body.error.message || body.error)))) ||
    DEFAULT_MESSAGES[status] || (status === 0 ? '서버에 연결하지 못했어요. 네트워크를 확인해 주세요.' : DEFAULT_MESSAGES[500]);
  return new ApiError(status, String(msg), body);
}

/* ---------- 필드 정규화 ---------- */
const pick = (o, ...keys) => { for (const k of keys) if (o && o[k] !== undefined && o[k] !== null) return o[k]; return undefined; };
const list = (x, fn) => (Array.isArray(x) ? x : (x && Array.isArray(x.content) ? x.content : x && Array.isArray(x.items) ? x.items : [])).map(fn);

export function normalizeMember(m) {
  if (!m) return null;
  return {
    id: pick(m, 'id', 'memberId', 'userId'),
    email: pick(m, 'email') || '',
    nickname: pick(m, 'nickname', 'name') || '',
    profileIcon: pick(m, 'profileIcon', 'icon', 'avatarIcon') || null, // 없으면 첫 글자 기본 아이콘
  };
}

export function normalizeLogin(r) {
  return {
    accessToken: pick(r, 'accessToken', 'token', 'access_token'),
    member: normalizeMember(pick(r, 'member', 'user') || r),
  };
}

export function normalizeTeam(t) {
  return {
    id: pick(t, 'id', 'teamId'),
    name: pick(t, 'name', 'teamName') || '',
    description: pick(t, 'description', 'desc') || '',
    ownerId: pick(t, 'ownerId', 'creatorId') ?? (t.owner ? pick(t.owner, 'id', 'memberId') : undefined),
    memberCount: pick(t, 'memberCount') ?? (Array.isArray(t.members) ? t.members.length : undefined),
    members: Array.isArray(t.members) ? t.members.map(normalizeTeamMember) : [],
    createdAt: pick(t, 'createdAt'),
  };
}
export const normalizeTeams = (x) => list(x, normalizeTeam);

export function normalizeTeamMember(m) {
  const base = normalizeMember(pick(m, 'member', 'user') || m);
  const role = String(pick(m, 'role') || (m.owner || m.isOwner ? 'OWNER' : 'MEMBER')).toUpperCase();
  return { ...base, role: role === 'OWNER' || role === 'LEADER' ? 'OWNER' : 'MEMBER', joinedAt: pick(m, 'joinedAt', 'createdAt') };
}
export const normalizeTeamMembers = (x) => list(x, normalizeTeamMember);

export function normalizeFile(f) {
  return {
    id: pick(f, 'id', 'fileId'),
    name: pick(f, 'name', 'fileName', 'originalName') || '',
    size: Number(pick(f, 'size', 'fileSize') || 0),
    version: Number(pick(f, 'version', 'latestVersion') || 1),
    uploader: normalizeMember(pick(f, 'uploader', 'uploadedBy', 'member')),
    uploadedAt: pick(f, 'uploadedAt', 'updatedAt', 'createdAt'),
    commitId: pick(f, 'commitId'),
    versions: Array.isArray(f.versions) ? f.versions.map((v) => ({
      version: Number(pick(v, 'version')),
      commitId: pick(v, 'commitId'),
      size: Number(pick(v, 'size', 'fileSize') || 0),
      uploader: normalizeMember(pick(v, 'uploader', 'uploadedBy')),
      uploadedAt: pick(v, 'uploadedAt', 'createdAt'),
    })) : [],
  };
}
export const normalizeFiles = (x) => list(x, normalizeFile);

const COMMIT_TYPES = { UPLOAD: 'UPLOAD', DELETE: 'DELETE' };
export function normalizeCommit(c) {
  return {
    id: pick(c, 'id', 'commitId'),
    hash: String(pick(c, 'hash', 'shortId', 'commitHash') || pick(c, 'id', 'commitId') || ''),
    message: pick(c, 'message', 'commitMessage') || '',
    type: COMMIT_TYPES[String(pick(c, 'type', 'kind') || 'UPLOAD').toUpperCase()] || 'UPLOAD',
    author: normalizeMember(pick(c, 'author', 'member', 'committer')),
    createdAt: pick(c, 'createdAt'),
    prId: pick(c, 'prId', 'pullId', 'pullRequestId') ?? null,
    fileCount: pick(c, 'fileCount'),
  };
}
export const normalizeCommits = (x) => list(x, normalizeCommit);

const ACTIONS = { ADD: 'ADD', ADDED: 'ADD', CREATE: 'ADD', MODIFY: 'MODIFY', MODIFIED: 'MODIFY', UPDATE: 'MODIFY', DELETE: 'DELETE', DELETED: 'DELETE' };
export function normalizeCommitFile(f) {
  return {
    fileId: pick(f, 'fileId', 'id'),
    name: pick(f, 'name', 'fileName') || '',
    size: Number(pick(f, 'size', 'fileSize') || 0),
    version: Number(pick(f, 'version') || 1),
    action: ACTIONS[String(pick(f, 'action', 'changeType') || 'ADD').toUpperCase()] || 'ADD',
  };
}
export const normalizeCommitFiles = (x) => list(x, normalizeCommitFile);

const TASK_STATUS = ['TODO', 'DOING', 'DONE'];
const PRIORITY = { HIGH: 'HIGH', MEDIUM: 'MEDIUM', NORMAL: 'MEDIUM', LOW: 'LOW' };
export function normalizeTask(t) {
  const st = String(pick(t, 'status') || 'TODO').toUpperCase();
  return {
    id: pick(t, 'id', 'taskId'),
    title: pick(t, 'title') || '',
    description: pick(t, 'description', 'content') || '',
    status: TASK_STATUS.includes(st) ? st : 'TODO',
    priority: PRIORITY[String(pick(t, 'priority') || 'MEDIUM').toUpperCase()] || 'MEDIUM',
    assignee: normalizeMember(pick(t, 'assignee', 'manager')),
    startDate: pick(t, 'startDate', 'workDate') || '',
    dueDate: pick(t, 'dueDate', 'deadline', 'endDate') || '',
    pullCount: Number(pick(t, 'pullCount', 'prCount') || 0),
    createdAt: pick(t, 'createdAt'),
  };
}
export const normalizeTasks = (x) => list(x, normalizeTask);

/* PR 상태: 화면·URL 은 소문자(waiting/approved/closed), 서버는 대문자로 보낸다고 가정 */
const PR_STATUS = { WAITING: 'waiting', OPEN: 'waiting', APPROVED: 'approved', CLOSED: 'closed', REJECTED: 'closed' };
export const pullStatusToApi = (s) => (s ? String(s).toUpperCase() : undefined);
export function normalizePull(p) {
  const task = pick(p, 'task');
  return {
    id: pick(p, 'id', 'prId', 'pullId'),
    title: pick(p, 'title') || '',
    description: pick(p, 'description', 'content') || '',
    status: PR_STATUS[String(pick(p, 'status') || 'WAITING').toUpperCase()] || 'waiting',
    author: normalizeMember(pick(p, 'author', 'member')),
    reviewers: (pick(p, 'reviewers') || []).map(normalizeMember),
    task: task ? { id: pick(task, 'id', 'taskId'), title: pick(task, 'title') || '', status: String(pick(task, 'status') || 'TODO').toUpperCase() } : null,
    commits: (pick(p, 'commits') || []).map(normalizeCommit),
    files: (pick(p, 'files') || []).map(normalizeCommitFile),
    reviewCount: Number(pick(p, 'reviewCount') || 0),
    decidedBy: normalizeMember(pick(p, 'decidedBy')),
    decidedAt: pick(p, 'decidedAt'),
    createdAt: pick(p, 'createdAt'),
  };
}
export const normalizePulls = (x) => list(x, normalizePull);

const REVIEW_TYPES = { COMMENT: 'COMMENT', REJECT: 'REJECT', APPROVE: 'APPROVE' };
export function normalizeReview(r) {
  return {
    id: pick(r, 'id', 'reviewId'),
    author: normalizeMember(pick(r, 'author', 'member', 'reviewer')),
    content: pick(r, 'content', 'comment', 'body') || '',
    type: REVIEW_TYPES[String(pick(r, 'type') || 'COMMENT').toUpperCase()] || 'COMMENT',
    createdAt: pick(r, 'createdAt'),
  };
}
export const normalizeReviews = (x) => list(x, normalizeReview);
