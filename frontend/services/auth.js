/* [담당 1] 회원·인증 API (API-001 ~ 004)
   경로·메서드가 바뀌면 AUTH_API 표만 고친다. */
import { request } from './client';
import { normalizeMember, normalizeLogin } from './adapter';

export const AUTH_API = {
  signup: { key: 'auth.signup', method: 'POST', path: '/api/v1/members', auth: false },   // API-001 회원가입
  me:     { key: 'auth.me',     method: 'GET',  path: '/api/v1/members/me' },              // API-002 내 정보 조회
  login:  { key: 'auth.login',  method: 'POST', path: '/api/v1/auth/login', auth: false }, // API-003 로그인
  logout: { key: 'auth.logout', method: 'POST', path: '/api/v1/auth/logout' },             // API-004 로그아웃
  updateMe: { key: 'auth.updateMe', method: 'PATCH', path: '/api/v1/members/me' },          // (명세 추가 필요) 내 프로필 아이콘 변경 — Could
};

export const signup = ({ email, password, nickname }) =>
  request(AUTH_API.signup, { body: { email, password, nickname } }).then(normalizeMember);

/** @returns {{ accessToken: string, member: {id,email,nickname} }} */
export const login = ({ email, password }) =>
  request(AUTH_API.login, { body: { email, password } }).then(normalizeLogin);

export const logout = () => request(AUTH_API.logout);

export const getMe = () => request(AUTH_API.me).then(normalizeMember);

/** 프로필 아이콘 변경 (Could). iconKey: 'cat' 등 utils/profileIcons.js 의 키, null 이면 기본(첫 글자) 아이콘
 *  임시 경로: PATCH /api/v1/members/me  본문 { profileIcon } — 명세서에 없어 추가 필요 */
export const updateMyIcon = (iconKey) =>
  request(AUTH_API.updateMe, { body: { profileIcon: iconKey } }).then(normalizeMember);
