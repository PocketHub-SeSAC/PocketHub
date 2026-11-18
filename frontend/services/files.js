/* [담당 3] 파일·커밋 API (API-013 ~ 021) */
import { request } from './client';
import { normalizeFile, normalizeFiles, normalizeCommit, normalizeCommits, normalizeCommitFiles } from './adapter';

export const FILES_API = {
  list:               { key: 'files.list',               method: 'GET',    path: '/api/v1/teams/{teamId}/files' },                                        // API-014
  detail:             { key: 'files.detail',             method: 'GET',    path: '/api/v1/teams/{teamId}/files/{fileId}' },                               // API-015
  download:           { key: 'files.download',           method: 'GET',    path: '/api/v1/teams/{teamId}/files/{fileId}/download' },                      // API-016
  upload:             { key: 'files.upload',             method: 'POST',   path: '/api/v1/teams/{teamId}/commits' },                                      // API-013
  remove:             { key: 'files.remove',             method: 'DELETE', path: '/api/v1/teams/{teamId}/commits/{fileId}' },                             // API-017
  commits:            { key: 'files.commits',            method: 'GET',    path: '/api/v1/teams/{teamId}/commits' },                                      // API-018
  commitDetail:       { key: 'files.commitDetail',       method: 'GET',    path: '/api/v1/teams/{teamId}/commits/{commitId}' },                           // API-019
  commitFiles:        { key: 'files.commitFiles',        method: 'GET',    path: '/api/v1/teams/{teamId}/commits/{commitId}/files' },                     // API-020
  commitFileDownload: { key: 'files.commitFileDownload', method: 'GET',    path: '/api/v1/teams/{teamId}/commits/{commitId}/download' },                  // API-021
};

/** 파일 1개 = 커밋 1개. multipart: files(백엔드는 여러 개를 받지만 화면은 1개만 보냄) + commitMessage(필수) */
export function uploadFile(teamId, { file, message }) {
  const form = new FormData();
  form.append('files', file);
  form.append('commitMessage', message);
  return request(FILES_API.upload, { params: { teamId }, body: form }).then(normalizeCommit);
}

export const getFiles = (teamId) => request(FILES_API.list, { params: { teamId } }).then((res) => {
  return normalizeFiles(res.files);
});

export const getFile = (teamId, fileId) =>
  request(FILES_API.detail, { params: { teamId, fileId }, handle404: false }).then(normalizeFile);

/** @returns {{ blob: Blob, filename: string }} → client.saveBlob 으로 저장 */
export const downloadFile = (teamId, fileId) => request(FILES_API.download, { params: { teamId, fileId }, blob: true });

/** 삭제도 커밋으로 남는다 → 커밋 메시지를 쿼리로 보낸다: DELETE …/files/{fileId}?commitMessage=…
 *  (DELETE 본문은 서버·프록시가 버리는 경우가 많아 쿼리 파라미터를 쓴다. 백엔드와 이름을 맞출 것) */
export const deleteFile = (teamId, fileId, { message }) =>
  request(FILES_API.remove, { params: { teamId, fileId }, query: { commitMessage : message } }).then(normalizeCommit);

/** usePr: true 면 PR 에 아직 안 묶인 커밋만 (백엔드 ?usePr=true). false·생략이면 쿼리에 넣지 않는다 */
export const getCommits = (teamId, { page, size, usePr } = {}) =>
  request(FILES_API.commits, { params: { teamId }, query: { page, size, usePr: usePr ? true : undefined } }).then((res) => normalizeCommits(res.commits));

/** 커밋 목록 한 페이지 (API-018 ?page=&size=). 페이지 정보는 응답의 pageInfo(data 밖) 에 온다
 *  @returns {{ items, page, size, totalPages, totalElements }} */
export const getCommitsPage = (teamId, { page = 0, size = 10 } = {}) =>
  request(FILES_API.commits, { params: { teamId }, query: { page, size }, withMeta: true })
    .then(({ data, meta }) => ({
      items: normalizeCommits(data?.commits),
      page: meta.page ?? page,
      size: meta.size ?? size,
      totalPages: meta.totalPages,
      totalElements: meta.totalElements,
    }));

export const getCommit = (teamId, commitId) =>
  request(FILES_API.commitDetail, { params: { teamId, commitId }, handle404: false }).then(normalizeCommit);

export const getCommitFiles = (teamId, commitId) =>
  request(FILES_API.commitFiles, { params: { teamId, commitId }, handle404: false }).then(normalizeCommitFiles);

/** 커밋에 포함된 버전(이전 버전 포함) 다운로드 */
export const downloadCommitFile = (teamId, commitId) =>
  request(FILES_API.commitFileDownload, { params: { teamId, commitId }, blob: true });
