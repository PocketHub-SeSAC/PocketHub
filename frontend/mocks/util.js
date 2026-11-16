/* 목업 핸들러 공통 도구 */
export class MockHttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
export const fail = (status, message) => { throw new MockHttpError(status, message); };
export const ok = (data) => ({ status: 200, data });
export const created = (data) => ({ status: 201, data });
export const noContent = () => ({ status: 204 });

export const now = () => new Date().toISOString();
export const toId = (v) => Number(v);
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const publicUser = (db, id) => {
  const u = db.users.find((x) => x.id === id);
  return u ? { id: u.id, email: u.email, nickname: u.nickname, profileIcon: u.profileIcon || null } : null;
};

/** 팀이 없거나 내가 팀원이 아니면 404 (다른 팀이 있다는 사실을 드러내지 않음) */
export function requireMember(db, teamId, user) {
  const id = toId(teamId);
  const team = db.teams.find((t) => t.id === id);
  if (!team || !db.members.some((m) => m.teamId === id && m.userId === user.id)) fail(404, '찾을 수 없습니다.');
  return team;
}

export const isMember = (db, teamId, userId) => db.members.some((m) => m.teamId === teamId && m.userId === userId);

export function str(v) { return typeof v === 'string' ? v.trim() : ''; }
