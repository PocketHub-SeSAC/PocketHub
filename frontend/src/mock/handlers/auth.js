/* [담당 1] 목업: 회원·인증 */
import { nextId } from '../db';
import { fail, ok, created, noContent, publicUser, str, EMAIL_RE } from '../util';
import { PROFILE_ICON_KEYS } from '../../config/profileIcons';

export const handlers = {
  'auth.signup': ({ db, body }) => {
    const email = str(body?.email).toLowerCase();
    const password = typeof body?.password === 'string' ? body.password : '';
    const nickname = str(body?.nickname);
    if (!EMAIL_RE.test(email)) fail(400, '이메일 형식이 올바르지 않아요. 예: you@example.com');
    if (password.length < 8) fail(400, '비밀번호는 8자 이상이어야 해요.');
    if (nickname.length < 2 || nickname.length > 10) fail(400, '닉네임은 2~10자로 입력해 주세요.');
    if (db.users.some((u) => u.email === email)) fail(409, '이미 가입된 이메일이에요. 로그인해 주세요.');
    const user = { id: nextId(db, 'user'), email, password, nickname };
    db.users.push(user);
    return created(publicUser(db, user.id));
  },

  'auth.login': ({ db, body }) => {
    const email = str(body?.email).toLowerCase();
    const user = db.users.find((u) => u.email === email && u.password === body?.password);
    if (!user) fail(401, '이메일 또는 비밀번호가 올바르지 않습니다.');
    const token = `mock-${user.id}-${nextId(db, 'session')}-${Math.random().toString(36).slice(2, 8)}`;
    db.sessions[token] = user.id;
    return ok({ accessToken: token, member: publicUser(db, user.id) });
  },

  'auth.logout': ({ db, token }) => {
    delete db.sessions[token];
    return noContent();
  },

  'auth.me': ({ db, user }) => ok(publicUser(db, user.id)),

  // (명세 추가 필요) 프로필 아이콘 변경 — 키 문자열만 저장
  'auth.updateMe': ({ db, user, body }) => {
    const key = body?.profileIcon ?? null;
    if (key !== null && !PROFILE_ICON_KEYS.includes(key)) fail(400, '고를 수 없는 아이콘이에요.');
    db.users.find((u) => u.id === user.id).profileIcon = key;
    return ok(publicUser(db, user.id));
  },
};

/** ?dev 조작판: 비밀번호 없이 다른 사용자로 로그인 (목업 전용) */
export function devLoginAs(db, userId) {
  const token = `mock-${userId}-${nextId(db, 'session')}-dev`;
  db.sessions[token] = userId;
  return token;
}
