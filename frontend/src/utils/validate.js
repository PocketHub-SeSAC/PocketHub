/* 화면 입력 검증 (서버도 같은 규칙으로 다시 검사한다고 가정) */
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function checkEmail(v) {
  const s = String(v || '').trim();
  if (!s) return '이메일을 입력해 주세요.';
  if (!EMAIL_RE.test(s)) return '이메일 형식이 올바르지 않아요. 예: you@example.com';
  return '';
}
export function checkPassword(v, { forSignup = false } = {}) {
  if (!v) return '비밀번호를 입력해 주세요.';
  if (forSignup && v.length < 8) return '비밀번호는 8자 이상이어야 해요.';
  return '';
}
export function checkNickname(v) {
  const s = String(v || '').trim();
  if (!s) return '닉네임을 입력해 주세요.';
  if (s.length < 2 || s.length > 10) return '닉네임은 2~10자로 입력해 주세요.';
  return '';
}
/** 로그인 후 돌아갈 주소: 같은 사이트 안 경로만 허용 */
export function safeNext(next) {
  return next && next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/auth') ? next : '/teams';
}
