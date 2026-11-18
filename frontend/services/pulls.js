/* [담당 5] PR·리뷰 API (API-029 ~ 037) */
import { request } from './client';
import { normalizePull, normalizePulls, normalizeReview, normalizeReviews, pullStatusToApi } from './adapter';

/* 리뷰(의견) API-034~037: 백엔드 review 패키지가 생겨 실서버에서도 켠다 */
export const REVIEWS_ENABLED = true;

export const PULLS_API = {
  create:       { key: 'pulls.create',       method: 'POST',   path: '/api/v1/teams/{teamId}/pulls' },                                // API-029
  list:         { key: 'pulls.list',         method: 'GET',    path: '/api/v1/teams/{teamId}/pulls' },                                // API-030 (?status=)
  detail:       { key: 'pulls.detail',       method: 'GET',    path: '/api/v1/teams/{teamId}/pulls/{prId}' },                         // API-031
  update:       { key: 'pulls.update',       method: 'PATCH',  path: '/api/v1/teams/{teamId}/pulls/{prId}' },                         // PR 수정
  remove:       { key: 'pulls.remove',       method: 'DELETE', path: '/api/v1/teams/{teamId}/pulls/{prId}' },                         // PR 삭제
  changeTask:   { key: 'pulls.changeTask',   method: 'PATCH',  path: '/api/v1/teams/{teamId}/pulls/{prId}/task' },                    // PR 연결 Task 변경
  approve:      { key: 'pulls.approve',      method: 'POST',   path: '/api/v1/teams/{teamId}/pulls/{prId}/approve' },                 // API-032
  reject:       { key: 'pulls.reject',       method: 'POST',   path: '/api/v1/teams/{teamId}/pulls/{prId}/reject' },                  // API-033
  createReview: { key: 'pulls.createReview', method: 'POST',   path: '/api/v1/teams/{teamId}/pulls/{prId}/reviews' },                 // API-034
  reviews:      { key: 'pulls.reviews',      method: 'GET',    path: '/api/v1/teams/{teamId}/pulls/{prId}/reviews' },                 // API-035
  updateReview: { key: 'pulls.updateReview', method: 'PATCH',  path: '/api/v1/teams/{teamId}/pulls/{prId}/reviews/{reviewId}' },      // API-036
  deleteReview: { key: 'pulls.deleteReview', method: 'DELETE', path: '/api/v1/teams/{teamId}/pulls/{prId}/reviews/{reviewId}' },      // API-037
};

/** 승인·거부할 수 있는지: 리뷰 대기 + 내가 작성자가 아님 (백엔드 규칙과 같음. 리뷰어 지정은 아직 없음) */
export const canDecidePull = (p, me) => p.status === 'waiting' && !!me && p.author?.id !== me.id;
// 리뷰어 지정 없이 PR 작성자를 뺀 팀원 누구나 리뷰 작성, 리뷰 대기일 때만
export const canReviewPull = (p, me) => p.status === 'waiting' && !!me && p.author?.id !== me.id;
/** 수정·삭제할 수 있는지: 리뷰 대기 + 내가 작성자 */
export const canEditPull = (p, me) => p.status === 'waiting' && !!me && p.author?.id === me.id;

/** { title, description, commitIds: [], taskId } → 생성되면 바로 리뷰 대기 */
export const createPull = (teamId, pr) =>
  request(PULLS_API.create, { params: { teamId }, body: pr }).then(normalizePull);

/** status: 'waiting' | 'approved' | 'closed' (없으면 전체)
 *  { quiet: true } = 배경 갱신용(알림 배지 등): 404 여도 메인으로 보내지 않는다 */
export const getPulls = (teamId, status, { quiet = false } = {}) =>
  request(PULLS_API.list, { params: { teamId }, query: { status: pullStatusToApi(status) }, handle404: !quiet }).then(normalizePulls);

export const getPull = (teamId, prId) =>
  request(PULLS_API.detail, { params: { teamId, prId }, handle404: false }).then(normalizePull);

/** 작성자 본인, 리뷰 대기일 때만 제목·설명 수정 */
export const updatePull = (teamId, prId, { title, description }) =>
  request(PULLS_API.update, { params: { teamId, prId }, body: { title, description } }).then(normalizePull);

/** 작성자 본인, 리뷰 대기일 때만 연결 Task 변경 (Task 가 삭제돼 연결이 끊겼을 때 다시 연결) */
export const changePullTask = (teamId, prId, { taskId }) =>
  request(PULLS_API.changeTask, { params: { teamId, prId }, body: { taskId } }).then(normalizePull);

/** 작성자 본인, 리뷰 대기일 때만. 묶였던 커밋은 다시 PR 에 넣을 수 있게 풀린다 */
export const deletePull = (teamId, prId) =>
  request(PULLS_API.remove, { params: { teamId, prId }, handle404: false });

export const approvePull = (teamId, prId) => request(PULLS_API.approve, { params: { teamId, prId } }).then(normalizePull);

/** 거부 사유는 필수이고 PR 의 reply 로 남는다 */
export const rejectPull = (teamId, prId, { reason }) =>
  request(PULLS_API.reject, { params: { teamId, prId }, body: { reason } }).then(normalizePull);

export const createReview = (teamId, prId, { content }) =>
  request(PULLS_API.createReview, { params: { teamId, prId }, body: { content } }).then(normalizeReview);

export const getReviews = (teamId, prId) =>
  request(PULLS_API.reviews, { params: { teamId, prId }, handle404: false }).then(normalizeReviews);

export const updateReview = (teamId, prId, reviewId, { content }) =>
  request(PULLS_API.updateReview, { params: { teamId, prId, reviewId }, body: { content } }).then(normalizeReview);

export const deleteReview = (teamId, prId, reviewId) =>
  request(PULLS_API.deleteReview, { params: { teamId, prId, reviewId } });
