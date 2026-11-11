/* [담당 3] 파일·커밋 API (API-013 ~ 021) */
import { request } from './client';
import { normalizeFile, normalizeFiles, normalizeCommit, normalizeCommits, normalizeCommitFiles } from './adapter';

export const FILES_API = {
  upload:             { key: 'files.upload',             method: 'POST',   path: '/api/v1/teams/{teamId}/files' },                                        // API-013
  list:               { key: 'files.list',               method: 'GET',    path: '/api/v1/teams/{teamId}/files' },                                        // API-014
  detail:             { key: 'files.detail',             method: 'GET',    path: '/api/v1/teams/{teamId}/files/{fileId}' },                               // API-015
  download:           { key: 'files.download',           method: 'GET',    path: '/api/v1/teams/{teamId}/files/{fileId}/download' },                      // API-016
  remove:             { key: 'files.remove',             method: 'DELETE', path: '/api/v1/teams/{teamId}/files/{fileId}' },                               // API-017
  commits:            { key: 'files.commits',            method: 'GET',    path: '/api/v1/teams/{teamId}/commits' },                                      // API-018
  commitDetail:       { key: 'files.commitDetail',       method: 'GET',    path: '/api/v1/teams/{teamId}/commits/{commitId}' },                           // API-019
  commitFiles:        { key: 'files.commitFiles',        method: 'GET',    path: '/api/v1/teams/{teamId}/commits/{commitId}/files' },                     // API-020
  commitFileDownload: { key: 'files.commitFileDownload', method: 'GET',    path: '/api/v1/teams/{teamId}/commits/{commitId}/files/{fileId}/download' },   // API-021
};

/** 파일 1개 = 커밋 1개. multipart: file(1개) + message(커밋 메시지, 필수) */
export function uploadFile(teamId, { file, message }) {
  const form = new FormData();
  form.append('file', file);
  form.append('message', message);
  return request(FILES_API.upload, { params: { teamId }, body: form }).then(normalizeCommit);
}

export const getFiles = (teamId) => request(FILES_API.list, { params: { teamId } }).then(normalizeFiles);

export const getFile = (teamId, fileId) =>
  request(FILES_API.detail, { params: { teamId, fileId }, handle404: false }).then(normalizeFile);

/** @returns {{ blob: Blob, filename: string }} → client.saveBlob 으로 저장 */
export const downloadFile = (teamId, fileId) => request(FILES_API.download, { params: { teamId, fileId }, blob: true });

/** 삭제도 커밋으로 남는다 → 커밋 메시지를 쿼리로 보낸다: DELETE …/files/{fileId}?message=…
 *  (DELETE 본문은 서버·프록시가 버리는 경우가 많아 쿼리 파라미터를 쓴다. 백엔드와 이름을 맞출 것) */
export const deleteFile = (teamId, fileId, { message }) =>
  request(FILES_API.remove, { params: { teamId, fileId }, query: { message } }).then(normalizeCommit);

export const getCommits = (teamId) => request(FILES_API.commits, { params: { teamId } }).then(normalizeCommits);

export const getCommit = (teamId, commitId) =>
  request(FILES_API.commitDetail, { params: { teamId, commitId }, handle404: false }).then(normalizeCommit);

export const getCommitFiles = (teamId, commitId) =>
  request(FILES_API.commitFiles, { params: { teamId, commitId }, handle404: false }).then(normalizeCommitFiles);

/** 커밋에 포함된 버전(이전 버전 포함) 다운로드 */
export const downloadCommitFile = (teamId, commitId, fileId) =>
  request(FILES_API.commitFileDownload, { params: { teamId, commitId, fileId }, blob: true });
