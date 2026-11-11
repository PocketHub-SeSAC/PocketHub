import { useEffect, useState } from 'react';
import { THEMES, getTheme, setTheme } from '../../theme/theme';

/* 메인 하단 테마 선택: 글자 없이 색 네모 3개. 스크린리더용 aria-label / aria-pressed 만 둔다 */
export default function ThemePicker() {
  const [cur, setCur] = useState(getTheme);
  useEffect(() => {
    const on = (e) => setCur(e.detail);
    window.addEventListener('pockethub:theme', on);
    return () => window.removeEventListener('pockethub:theme', on);
  }, []);
  return (
    <div className="theme-pick" role="group" aria-label="테마 선택">
      {THEMES.map((t) => (
        <button key={t.id} type="button" className={`sw-${t.id}`} aria-label={t.label} aria-pressed={cur === t.id}
          onClick={() => setTheme(t.id)} />
      ))}
    </div>
  );
}
