/* [담당 5] 목업: PR·리뷰 */

/* 백엔드(PrService) 규칙에 맞춘다
   - 생성: 내 커밋 중 PR 에 안 묶인 커밋 1개 이상, Task 1개 → 바로 리뷰 대기 (리뷰어 지정 없음)
   - 승인·거부: 작성자가 아닌 팀원, 리뷰 대기일 때만. 1명이 결정하면 확정
   - 승인 → 연결 Task 를 DONE / 거부(사유 필수) → 사유는 PR 의 reply 로 남음, 커밋은 그대로
   - 수정·삭제: 작성자 본인, 리뷰 대기일 때만. 삭제하면 커밋이 풀린다
   - 리뷰 작성: PR 작성자를 뺀 팀원 누구나, 4000자 이하. 처리된(승인·거부) PR 에는 작성·수정·삭제 불가
   - 리뷰 수정·삭제는 리뷰 작성자 본인만 */
import { nextId } from '@/mocks/db';
import { fail, ok, created, noContent, publicUser, requireMember, str, toId, now } from '@/mocks/util';
import { commitView, commitFilesView } from './files';

const STATUS = { WAITING: 'WAITING', APPROVED: 'APPROVED', CLOSED: 'CLOSED' };
const REVIEW_MAX = 4000; // 백엔드 ValidationRules.REVIEW_COMMENT_MAX

const taskRef = (db, id) => {
  const t = db.tasks.find((x) => x.id === id);
  return t ? { id: t.id, title: t.title, status: t.status } : null;
};

export const pullSummary = (db, p) => ({
  id: p.id, title: p.title, status: p.status,
  author: publicUser(db, p.authorId),
  // 리뷰어 지정은 없앴지만 마이페이지(공통 화면)가 아직 reviewers 를 읽어서 샘플 데이터 값만 그대로 내보낸다
  reviewers: (p.reviewerIds || []).map((id) => publicUser(db, id)).filter(Boolean),
  task: taskRef(db, p.taskId),
  reviewCount: db.reviews.filter((r) => r.prId === p.id).length,
  createdAt: p.createdAt, decidedAt: p.decidedAt,
  decidedBy: p.decidedById ? publicUser(db, p.decidedById) : null,
  reply: p.reply || null,
});

const pullDetail = (db, p) => {
  const commits = p.commitIds.map((id) => db.commits.find((c) => c.id === id)).filter(Boolean);
  return {
    ...pullSummary(db, p),
    description: p.description,
    commits: commits.map((c) => commitView(db, c)),
    files: commits.flatMap((c) => commitFilesView(db, c)),
  };
};

const reviewView = (db, r) => ({ id: r.id, author: publicUser(db, r.authorId), content: r.content, type: r.type, createdAt: r.createdAt });

function findPull(db, team, prId) {
  const p = db.pulls.find((x) => x.id === toId(prId) && x.teamId === team.id);
  if (!p) fail(404, '찾을 수 없습니다.');
  return p;
}
function requireDecider(p, user, what) {
  if (p.status !== STATUS.WAITING) fail(409, '이미 처리된 PR입니다.');
  if (p.authorId === user.id) fail(403, `본인이 작성한 PR은 ${what}할 수 없습니다.`);
}
function reviewContent(body) {
  const content = str(body?.content);
  if (!content) fail(400, '리뷰 내용을 입력해 주세요.');
  if (content.length > REVIEW_MAX) fail(400, `리뷰는 ${REVIEW_MAX}자 이하로 입력해 주세요.`);
  return content;
}
function requireEditor(p, user, what) {
  if (p.status !== STATUS.WAITING) fail(409, `이미 처리된 PR은 ${what}할 수 없어요.`);
  if (p.authorId !== user.id) fail(403, `내가 작성한 PR만 ${what}할 수 있어요.`);
}

export const handlers = {
  'pulls.create': ({ db, user, params, body }) => {
    const team = requireMember(db, params.teamId, user);
    const title = str(body?.title);
    const description = str(body?.description);
    const commitIds = (Array.isArray(body?.commitIds) ? body.commitIds : []).map(toId);
    const taskId = body?.taskId ? toId(body.taskId) : null;
    if (!title) fail(400, 'PR 제목을 입력해 주세요.');
    if (!commitIds.length) fail(400, '포함할 커밋을 1개 이상 골라 주세요.');
    commitIds.forEach((id) => {
      const c = db.commits.find((x) => x.id === id && x.teamId === team.id && !x.excluded);
      if (!c) fail(400, '고른 커밋 중에 찾을 수 없는 커밋이 있어요. 목록을 새로고침해 주세요.');
      if (c.authorId !== user.id) fail(400, '내가 만든 커밋만 PR에 넣을 수 있어요.');
      if (c.prId) fail(400, `커밋 "${c.message}"은 이미 다른 PR에 연결돼 있어요.`);
    });
    if (!taskId || !db.tasks.some((t) => t.id === taskId && t.teamId === team.id)) fail(400, '연결할 Task를 1개 골라 주세요.');

    const p = { id: nextId(db, 'pull'), teamId: team.id, title, description, authorId: user.id, taskId, commitIds, status: STATUS.WAITING, createdAt: now(), decidedById: null, decidedAt: null };
    db.pulls.push(p);
    db.commits.forEach((c) => { if (commitIds.includes(c.id)) c.prId = p.id; });
    return created(pullDetail(db, p));
  },

  'pulls.list': ({ db, user, params, query }) => {
    const team = requireMember(db, params.teamId, user);
    const st = query.status ? String(query.status).toUpperCase() : null;
    if (st && !STATUS[st]) fail(400, '상태는 WAITING·APPROVED·CLOSED 중 하나여야 해요.');
    return ok(db.pulls.filter((p) => p.teamId === team.id && (!st || p.status === st)).sort((a, b) => b.id - a.id).map((p) => pullSummary(db, p)));
  },

  'pulls.detail': ({ db, user, params }) => {
    const team = requireMember(db, params.teamId, user);
    return ok(pullDetail(db, findPull(db, team, params.prId)));
  },

  'pulls.approve': ({ db, user, params }) => {
    const team = requireMember(db, params.teamId, user);
    const p = findPull(db, team, params.prId);
    requireDecider(p, user, '승인');
    p.status = STATUS.APPROVED; p.decidedById = user.id; p.decidedAt = now();
    const t = db.tasks.find((x) => x.id === p.taskId);
    if (t) t.status = 'DONE';
    return ok(pullDetail(db, p));
  },

  'pulls.reject': ({ db, user, params, body }) => {
    const team = requireMember(db, params.teamId, user);
    const p = findPull(db, team, params.prId);
    requireDecider(p, user, '거부');
    const reason = str(body?.reason);
    if (!reason) fail(400, '거부 사유를 입력해 주세요.');
    p.status = STATUS.CLOSED; p.decidedById = user.id; p.decidedAt = now(); p.reply = reason;
    return ok(pullDetail(db, p));
  },

  'pulls.update': ({ db, user, params, body }) => {
    const team = requireMember(db, params.teamId, user);
    const p = findPull(db, team, params.prId);
    requireEditor(p, user, '수정');
    const title = str(body?.title);
    if (!title) fail(400, 'PR 제목을 입력해 주세요.');
    p.title = title; p.description = str(body?.description);
    return ok(pullDetail(db, p));
  },

  'pulls.remove': ({ db, user, params }) => {
    const team = requireMember(db, params.teamId, user);
    const p = findPull(db, team, params.prId);
    requireEditor(p, user, '삭제');
    db.commits.forEach((c) => { if (c.prId === p.id) c.prId = null; });
    db.reviews = db.reviews.filter((r) => r.prId !== p.id);
    db.pulls = db.pulls.filter((x) => x.id !== p.id);
    return noContent();
  },

  'pulls.createReview': ({ db, user, params, body }) => {
    const team = requireMember(db, params.teamId, user);
    const p = findPull(db, team, params.prId);
    if (p.status !== STATUS.WAITING) fail(409, '이미 처리된 PR에는 리뷰를 남길 수 없습니다.');
    if (p.authorId === user.id) fail(403, '본인이 작성한 PR에는 리뷰를 남길 수 없습니다.');
    const content = reviewContent(body);
    const r = { id: nextId(db, 'review'), prId: p.id, authorId: user.id, content, type: 'COMMENT', createdAt: now() };
    db.reviews.push(r);
    return created(reviewView(db, r));
  },

  'pulls.reviews': ({ db, user, params }) => {
    const team = requireMember(db, params.teamId, user);
    const p = findPull(db, team, params.prId);
    return ok(db.reviews.filter((r) => r.prId === p.id).sort((a, b) => a.createdAt.localeCompare(b.createdAt)).map((r) => reviewView(db, r)));
  },

  'pulls.updateReview': ({ db, user, params, body }) => {
    const team = requireMember(db, params.teamId, user);
    const p = findPull(db, team, params.prId);
    if (p.status !== STATUS.WAITING) fail(409, '이미 처리된 PR의 리뷰는 수정할 수 없어요.');
    const r = db.reviews.find((x) => x.id === toId(params.reviewId) && x.prId === p.id);
    if (!r) fail(404, '찾을 수 없습니다.');
    if (r.authorId !== user.id) fail(403, '내가 쓴 리뷰만 수정할 수 있어요.');
    r.content = reviewContent(body);
    return ok(reviewView(db, r));
  },

  'pulls.deleteReview': ({ db, user, params }) => {
    const team = requireMember(db, params.teamId, user);
    const p = findPull(db, team, params.prId);
    if (p.status !== STATUS.WAITING) fail(409, '이미 처리된 PR의 리뷰는 삭제할 수 없어요.');
    const r = db.reviews.find((x) => x.id === toId(params.reviewId) && x.prId === p.id);
    if (!r) fail(404, '찾을 수 없습니다.');
    if (r.authorId !== user.id) fail(403, '내가 쓴 리뷰만 삭제할 수 있어요.');
    db.reviews = db.reviews.filter((x) => x.id !== r.id);
    return noContent();
  },
};
