/* 테마 선택 저장/적용. 색 값은 styles/themes.css 에 있다.
   index.html 의 깜빡임 방지 스크립트도 같은 키·값 목록을 쓴다. */
export const THEMES = [
  { id: 'default', label: '기본 테마' },
  { id: 'dark', label: '다크 테마' },
  { id: 'pink', label: '핑크 테마' },
];
const KEY = 'pockethub.theme';

export function getTheme() {
  try {
    const t = localStorage.getItem(KEY);
    return THEMES.some((x) => x.id === t) ? t : 'default';
  } catch { return 'default'; }
}

export function applyTheme(id) {
  const root = document.documentElement;
  if (id === 'default') delete root.dataset.theme; else root.dataset.theme = id;
}

export function setTheme(id) {
  applyTheme(id);
  try { localStorage.setItem(KEY, id); } catch { /* 저장 불가 */ }
  window.dispatchEvent(new CustomEvent('pockethub:theme', { detail: id }));
}
