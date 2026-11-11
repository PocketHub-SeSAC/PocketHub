/* [담당 3] 목업: 파일·커밋
   규칙
   - 파일 1개 = 커밋 1개 (한 번에 1개만). 같은 이름을 다시 올리면 새 버전(v2, v3 …)
   - 삭제도 커밋(DELETE)으로 남고, 올린 본인(현재 버전 업로더)만 삭제 가능
   - 거부된 PR 의 커밋은 excluded=true → 커밋 목록·파일 버전에서 빠진다
   파일의 현재 상태는 "목록에 남은 커밋"을 시간 순으로 훑어서 계산한다. */
import { nextId } from '../db';
import { fail, ok, created, publicUser, requireMember, str, toId, now } from '../util';
import { validateFile, ONE_FILE_ONLY } from '../../config/upload';

const hex6 = () => Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0');

export const visibleCommits = (db, teamId) =>
  db.commits.filter((c) => c.teamId === teamId && !c.excluded).sort((a, b) => a.createdAt.localeCompare(b.createdAt));

/** 파일의 현재 상태: null(목록에 없음) 또는 { current(버전), versions(최신순) } */
export function fileState(db, file) {
  const touches = [];
  visibleCommits(db, file.teamId).forEach((c) => c.items.forEach((it) => { if (it.fileId === file.id) touches.push({ c, it }); }));
  if (!touches.length) return null;
  if (touches[touches.length - 1].it.action === 'DELETE') return null;
  const versions = touches.filter((t) => t.it.action !== 'DELETE')
    .map((t) => db.versions.find((v) => v.id === t.it.versionId))
    .filter(Boolean)
    .sort((a, b) => b.version - a.version);
  return versions.length ? { current: versions[0], versions } : null;
}

const fileView = (db, f, st, withVersions = false) => ({
  id: f.id, name: f.name,
  size: st.current.size, version: st.current.version,
  uploader: publicUser(db, st.current.uploaderId), uploadedAt: st.current.uploadedAt, commitId: st.current.commitId,
  ...(withVersions ? { versions: st.versions.map((v) => ({ version: v.version, commitId: v.commitId, size: v.size, uploader: publicUser(db, v.uploaderId), uploadedAt: v.uploadedAt })) } : {}),
});

export const commitView = (db, c) => ({
  id: c.id, hash: c.hash, message: c.message, type: c.type,
  author: publicUser(db, c.authorId), createdAt: c.createdAt, prId: c.prId, fileCount: c.items.length,
});

export const commitFilesView = (db, c) => c.items.map((it) => {
  const f = db.files.find((x) => x.id === it.fileId);
  const v = db.versions.find((x) => x.id === it.versionId);
  return { fileId: it.fileId, name: f ? f.name : '(알 수 없는 파일)', size: v ? v.size : 0, version: v ? v.version : 1, action: it.action };
});

function findVisibleFile(db, team, fileId) {
  const f = db.files.find((x) => x.id === toId(fileId) && x.teamId === team.id);
  const st = f && fileState(db, f);
  if (!st) fail(404, '찾을 수 없습니다.');
  return { f, st };
}
function findVisibleCommit(db, team, commitId) {
  const c = db.commits.find((x) => x.id === toId(commitId) && x.teamId === team.id && !x.excluded);
  if (!c) fail(404, '찾을 수 없습니다.');
  return c;
}

const fakeBlob = (name, version) => ({
  blob: new Blob([`[포켓 헙 목업] ${name} (v${version})\n실제 백엔드에 연결하면 원본 파일을 내려받아요.\n`], { type: 'text/plain' }),
  filename: name,
});

export const handlers = {
  'files.upload': ({ db, user, params, body }) => {
    const team = requireMember(db, params.teamId, user);
    const message = str(body && body.get ? body.get('message') : '');
    const files = body && body.getAll ? body.getAll('file').filter((x) => x && typeof x === 'object') : [];
    if (files.length > 1) fail(400, ONE_FILE_ONLY);
    const file = files[0];
    const bad = validateFile(file);
    if (bad) fail(400, bad);
    if (!message) fail(400, '커밋 메시지를 입력해 주세요.');

    const at = now();
    let f = db.files.find((x) => x.teamId === team.id && x.name === file.name);
    let action = 'ADD';
    if (f) { if (fileState(db, f)) action = 'MODIFY'; }
    else { f = { id: nextId(db, 'file'), teamId: team.id, name: file.name }; db.files.push(f); }
    const commitId = nextId(db, 'commit');
    const maxV = Math.max(0, ...db.versions.filter((v) => v.fileId === f.id).map((v) => v.version));
    const v = { id: nextId(db, 'version'), fileId: f.id, version: maxV + 1, size: file.size, uploaderId: user.id, commitId, uploadedAt: at };
    db.versions.push(v);
    const commit = { id: commitId, teamId: team.id, hash: hex6(), message, type: 'UPLOAD', authorId: user.id, createdAt: at, prId: null, excluded: false, items: [{ fileId: f.id, versionId: v.id, action }] };
    db.commits.push(commit);
    return created(commitView(db, commit));
  },

  'files.list': ({ db, user, params }) => {
    const team = requireMember(db, params.teamId, user);
    const out = [];
    db.files.filter((f) => f.teamId === team.id).forEach((f) => { const st = fileState(db, f); if (st) out.push(fileView(db, f, st)); });
    out.sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
    return ok(out);
  },

  'files.detail': ({ db, user, params }) => {
    const team = requireMember(db, params.teamId, user);
    const { f, st } = findVisibleFile(db, team, params.fileId);
    return ok(fileView(db, f, st, true));
  },

  'files.download': ({ db, user, params }) => {
    const team = requireMember(db, params.teamId, user);
    const { f, st } = findVisibleFile(db, team, params.fileId);
    return fakeBlob(f.name, st.current.version);
  },

  'files.remove': ({ db, user, params, query }) => {
    const team = requireMember(db, params.teamId, user);
    const { f, st } = findVisibleFile(db, team, params.fileId);
    if (st.current.uploaderId !== user.id) fail(403, '파일을 올린 사람만 삭제할 수 있어요.');
    const message = str(query?.message); // DELETE …?message=커밋 메시지
    if (!message) fail(400, '삭제 이유를 커밋 메시지로 입력해 주세요.');
    const commit = { id: nextId(db, 'commit'), teamId: team.id, hash: hex6(), message, type: 'DELETE', authorId: user.id, createdAt: now(), prId: null, excluded: false, items: [{ fileId: f.id, versionId: st.current.id, action: 'DELETE' }] };
    db.commits.push(commit);
    return ok(commitView(db, commit));
  },

  'files.commits': ({ db, user, params }) => {
    const team = requireMember(db, params.teamId, user);
    return ok(visibleCommits(db, team.id).slice().reverse().map((c) => commitView(db, c)));
  },

  'files.commitDetail': ({ db, user, params }) => {
    const team = requireMember(db, params.teamId, user);
    return ok(commitView(db, findVisibleCommit(db, team, params.commitId)));
  },

  'files.commitFiles': ({ db, user, params }) => {
    const team = requireMember(db, params.teamId, user);
    return ok(commitFilesView(db, findVisibleCommit(db, team, params.commitId)));
  },

  'files.commitFileDownload': ({ db, user, params }) => {
    const team = requireMember(db, params.teamId, user);
    const c = findVisibleCommit(db, team, params.commitId);
    const it = c.items.find((x) => x.fileId === toId(params.fileId));
    if (!it) fail(404, '찾을 수 없습니다.');
    if (it.action === 'DELETE') fail(400, '삭제 기록이라 내려받을 파일이 없어요.');
    const f = db.files.find((x) => x.id === it.fileId);
    const v = db.versions.find((x) => x.id === it.versionId);
    return fakeBlob(f.name, v.version);
  },
};
