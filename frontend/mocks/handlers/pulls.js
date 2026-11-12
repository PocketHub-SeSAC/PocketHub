/* [담당 5] 목업: PR·리뷰 */

/* - 생성: 내 커밋 중 PR 에 안 묶인 커밋 1개 이상, 리뷰어는 본인 뺀 팀원 1명 이상, Task 1개 → 바로 리뷰 대기
   - 승인·거부: 지정된 리뷰어만, 리뷰어 중 1명이 결정하면 확정
   - 승인 → 연결 Task 를 DONE / 거부(사유 필수, 리뷰로 남음) → 그 PR 의 커밋·파일 버전이 목록에서 빠짐
   - 리뷰 수정·삭제는 작성자 본인만 */
import { nextId } from '@/mocks/db';
import { fail, ok, created, noContent, publicUser, requireMember, isMember, str, toId, now } from '@/mocks/util';
import { commitView, commitFilesView } from './files';

const STATUS = { WAITING: 'WAITING', APPROVED: 'APPROVED', CLOSED: 'CLOSED' };

const taskRef = (db, id) => {
  const t = db.tasks.find((x) => x.id === id);
  return t ? { id: t.id, title: t.title, status: t.status } : null;
};

export const pullSummary = (db, p) => ({
  id: p.id, title: p.title, status: p.status,
  author: publicUser(db, p.authorId),
  reviewers: p.reviewerIds.map((id) => publicUser(db, id)).filter(Boolean),
  task: taskRef(db, p.taskId),
  reviewCount: db.reviews.filter((r) => r.prId === p.id).length,
  createdAt: p.createdAt, decidedAt: p.decidedAt,
  decidedBy: p.decidedById ? publicUser(db, p.decidedById) : null,
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
  if (!p.reviewerIds.includes(user.id)) fail(403, `지정된 리뷰어만 ${what}할 수 있어요.`);
  if (p.status !== STATUS.WAITING) fail(409, '이미 승인 또는 거부가 결정된 PR이에요.');
}

export const handlers = {
  'pulls.create': ({ db, user, params, body }) => {
    const team = requireMember(db, params.teamId, user);
    const title = str(body?.title);
    const description = str(body?.description);
    const commitIds = (Array.isArray(body?.commitIds) ? body.commitIds : []).map(toId);
    const reviewerIds = [...new Set((Array.isArray(body?.reviewerIds) ? body.reviewerIds : []).map(toId))];
    const taskId = body?.taskId ? toId(body.taskId) : null;
    if (!title) fail(400, 'PR 제목을 입력해 주세요.');
    if (!commitIds.length) fail(400, '포함할 커밋을 1개 이상 골라 주세요.');
    commitIds.forEach((id) => {
      const c = db.commits.find((x) => x.id === id && x.teamId === team.id && !x.excluded);
      if (!c) fail(400, '고른 커밋 중에 찾을 수 없는 커밋이 있어요. 목록을 새로고침해 주세요.');
      if (c.authorId !== user.id) fail(400, '내가 만든 커밋만 PR에 넣을 수 있어요.');
      if (c.prId) fail(400, `커밋 "${c.message}"은 이미 다른 PR에 연결돼 있어요.`);
    });
    if (!reviewerIds.length) fail(400, '리뷰어를 1명 이상 골라 주세요.');
    if (reviewerIds.includes(user.id)) fail(400, '본인은 리뷰어로 지정할 수 없어요.');
    if (reviewerIds.some((id) => !isMember(db, team.id, id))) fail(400, '리뷰어는 이 팀의 팀원 중에서 골라 주세요.');
    if (!taskId || !db.tasks.some((t) => t.id === taskId && t.teamId === team.id)) fail(400, '연결할 Task를 1개 골라 주세요.');

    const p = { id: nextId(db, 'pull'), teamId: team.id, title, description, authorId: user.id, reviewerIds, taskId, commitIds, status: STATUS.WAITING, createdAt: now(), decidedById: null, decidedAt: null };
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
    if (!reason) fail(400, '거부 사유를 입력해 주세요. 사유는 리뷰로 남아요.');
    p.status = STATUS.CLOSED; p.decidedById = user.id; p.decidedAt = now();
    db.reviews.push({ id: nextId(db, 'review'), prId: p.id, authorId: user.id, content: reason, type: 'REJECT', createdAt: now() });
    db.commits.forEach((c) => { if (p.commitIds.includes(c.id)) c.excluded = true; });
    return ok(pullDetail(db, p));
  },

  'pulls.createReview': ({ db, user, params, body }) => {
    const team = requireMember(db, params.teamId, user);
    const p = findPull(db, team, params.prId);
    const content = str(body?.content);
    if (!content) fail(400, '리뷰 내용을 입력해 주세요.');
    if (content.length > 1000) fail(400, '리뷰는 1000자 이하로 입력해 주세요.');
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
    const r = db.reviews.find((x) => x.id === toId(params.reviewId) && x.prId === p.id);
    if (!r) fail(404, '찾을 수 없습니다.');
    if (r.authorId !== user.id) fail(403, '내가 쓴 리뷰만 수정할 수 있어요.');
    const content = str(body?.content);
    if (!content) fail(400, '리뷰 내용을 입력해 주세요.');
    r.content = content;
    return ok(reviewView(db, r));
  },

  'pulls.deleteReview': ({ db, user, params }) => {
    const team = requireMember(db, params.teamId, user);
    const p = findPull(db, team, params.prId);
    const r = db.reviews.find((x) => x.id === toId(params.reviewId) && x.prId === p.id);
    if (!r) fail(404, '찾을 수 없습니다.');
    if (r.authorId !== user.id) fail(403, '내가 쓴 리뷰만 삭제할 수 있어요.');
    db.reviews = db.reviews.filter((x) => x.id !== r.id);
    return noContent();
  },
};
