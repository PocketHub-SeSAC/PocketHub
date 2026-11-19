/* 로그인 토큰 저장소. 저장 방식(localStorage / 쿠키)을 바꾸려면 이 파일만 고친다 */
const KEY = 'pockethub.token';

export function getToken() {
  try { return localStorage.getItem(KEY); } catch { return null; }
}
export function setToken(token) {
  try { localStorage.setItem(KEY, token); } catch { /* 저장 불가 환경 */ }
}
export function clearToken() {
  try { localStorage.removeItem(KEY); } catch { /* 저장 불가 환경 */ }
}
