/* 화면 입력 검증 (서버도 같은 규칙으로 다시 검사한다고 가정) */
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_RE = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]+$/; // 백엔드 ValidationRules.PASSWORD_PATTERN
const NICKNAME_RE = /^[가-힣a-zA-Z0-9]+$/; // 백엔드 ValidationRules.NICKNAME_PATTERN

export function checkEmail(v) {
  const s = String(v || '').trim();
  if (!s) return '이메일을 입력해 주세요.';
  if (!EMAIL_RE.test(s)) return '이메일 형식이 올바르지 않아요. 예: you@example.com';
  return '';
}
export function checkPassword(v, { forSignup = false } = {}) {
  if (!v) return '비밀번호를 입력해 주세요.';
  if (!forSignup) return ''; // 로그인은 빈 값만 검사 (백엔드와 동일)
  if (v.length < 8 || v.length > 64) return '비밀번호는 8~64자로 입력해 주세요.';
  if (!PASSWORD_RE.test(v)) return '비밀번호는 영문과 숫자를 모두 포함해야 하며, 공백은 사용할 수 없어요.';
  return '';
}
export function checkNickname(v) {
  const s = String(v || '').trim();
  if (!s) return '닉네임을 입력해 주세요.';
  if (s.length < 2 || s.length > 45) return '닉네임은 2~45자로 입력해 주세요.';
  if (!NICKNAME_RE.test(s)) return '닉네임은 한글, 영문, 숫자만 사용할 수 있어요.';
  return '';
}
/** 로그인 후 돌아갈 주소: 같은 사이트 안 경로만 허용 */
export function safeNext(next) {
  return next && next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/auth') ? next : '/teams';
}