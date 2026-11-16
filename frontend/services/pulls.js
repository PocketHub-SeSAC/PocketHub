/* [담당 5] PR·리뷰 API (API-029 ~ 037) */
import { request } from './client';
import { normalizePull, normalizePulls, normalizeReview, normalizeReviews, pullStatusToApi } from './adapter';

export const PULLS_API = {
  create:       { key: 'pulls.create',       method: 'POST',   path: '/api/v1/teams/{teamId}/pulls' },                                // API-029
  list:         { key: 'pulls.list',         method: 'GET',    path: '/api/v1/teams/{teamId}/pulls' },                                // API-030 (?status=)
  detail:       { key: 'pulls.detail',       method: 'GET',    path: '/api/v1/teams/{teamId}/pulls/{prId}' },                         // API-031
  approve:      { key: 'pulls.approve',      method: 'POST',   path: '/api/v1/teams/{teamId}/pulls/{prId}/approve' },                 // API-032
  reject:       { key: 'pulls.reject',       method: 'POST',   path: '/api/v1/teams/{teamId}/pulls/{prId}/reject' },                  // API-033
  createReview: { key: 'pulls.createReview', method: 'POST',   path: '/api/v1/teams/{teamId}/pulls/{prId}/reviews' },                 // API-034
  reviews:      { key: 'pulls.reviews',      method: 'GET',    path: '/api/v1/teams/{teamId}/pulls/{prId}/reviews' },                 // API-035
  updateReview: { key: 'pulls.updateReview', method: 'PATCH',  path: '/api/v1/teams/{teamId}/pulls/{prId}/reviews/{reviewId}' },      // API-036
  deleteReview: { key: 'pulls.deleteReview', method: 'DELETE', path: '/api/v1/teams/{teamId}/pulls/{prId}/reviews/{reviewId}' },      // API-037
};

/** { title, description, commitIds: [], reviewerIds: [], taskId } → 생성되면 바로 리뷰 대기 */
export const createPull = (teamId, pr) =>
  request(PULLS_API.create, { params: { teamId }, body: pr }).then(normalizePull);

/** status: 'waiting' | 'approved' | 'closed' (없으면 전체)
 *  { quiet: true } = 배경 갱신용(알림 배지 등): 404 여도 메인으로 보내지 않는다 */
export const getPulls = (teamId, status, { quiet = false } = {}) =>
  request(PULLS_API.list, { params: { teamId }, query: { status: pullStatusToApi(status) }, handle404: !quiet }).then(normalizePulls);

export const getPull = (teamId, prId) =>
  request(PULLS_API.detail, { params: { teamId, prId }, handle404: false }).then(normalizePull);

export const approvePull = (teamId, prId) => request(PULLS_API.approve, { params: { teamId, prId } }).then(normalizePull);

/** 거부 사유는 필수이고 리뷰로 남는다 */
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
