/* [담당 5] PR 알림 배지 (Could) — 별도 알림 API 없이 기존 PR 목록 API(API-030)로 계산
   - review : 그 팀에서 내가 리뷰어로 지정된 "리뷰 대기" PR 수 → 팀 메뉴 PR 탭 숫자 배지
   - decided: 내가 만든 PR 중 승인·거부된 것 가운데 아직 PR 탭에서 확인 안 한 것 → 작은 점(●)
              확인 기록은 localStorage 에 PR 별로 (pockethub.prSeen.<내 id>)
   - 화면을 옮길 때와 30초마다 다시 불러온다 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { getTeams } from '../../api/teams';
import { getPulls } from '../../api/pulls';
import { useAuth } from '../../auth/AuthContext';

const POLL_MS = 30_000;
const NotiCtx = createContext({ byTeam: {}, total: 0, refresh: () => {}, markSeen: () => {} });

const seenKey = (userId) => `pockethub.prSeen.${userId}`;
function readSeen(userId) {
  try { return JSON.parse(localStorage.getItem(seenKey(userId)) || '[]'); } catch { return []; }
}
function writeSeen(userId, ids) {
  try { localStorage.setItem(seenKey(userId), JSON.stringify([...new Set(ids)])); } catch { /* 저장 불가 */ }
}

export function PrNotiProvider({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  const [byTeam, setByTeam] = useState({});
  const busy = useRef(false);
  const userId = user?.id;

  const refresh = useCallback(async () => {
    if (!userId) { setByTeam({}); return; }
    if (busy.current) return;
    busy.current = true;
    try {
      const teams = await getTeams();
      const seen = readSeen(userId);
      const rows = await Promise.all(teams.map(async (t) => {
        const prs = await getPulls(t.id, undefined, { quiet: true }).catch(() => []);
        return [String(t.id), {
          review: prs.filter((p) => p.status === 'waiting' && p.reviewers.some((r) => r.id === userId)).length,
          decided: prs.filter((p) => p.author?.id === userId && p.status !== 'waiting' && !seen.includes(p.id)).map((p) => p.id),
        }];
      }));
      setByTeam(Object.fromEntries(rows));
    } catch { /* 배지는 실패해도 화면을 막지 않는다 */ } finally { busy.current = false; }
  }, [userId]);

  // 화면 이동 시 + 30초마다
  useEffect(() => { refresh(); }, [refresh, location.pathname]);
  useEffect(() => {
    if (!userId) return undefined;
    const t = setInterval(refresh, POLL_MS);
    return () => clearInterval(t);
  }, [refresh, userId]);

  /** PR 탭에 들어오면 그 팀의 승인·거부 결과를 확인한 것으로 기록 */
  const markSeen = useCallback((teamId) => {
    const row = byTeam[String(teamId)];
    if (!userId || !row || !row.decided.length) return;
    writeSeen(userId, [...readSeen(userId), ...row.decided]);
    setByTeam((b) => ({ ...b, [String(teamId)]: { ...b[String(teamId)], decided: [] } }));
  }, [byTeam, userId]);

  const value = useMemo(() => ({
    byTeam,
    total: Object.values(byTeam).reduce((s, r) => s + r.review, 0),
    refresh,
    markSeen,
  }), [byTeam, refresh, markSeen]);
  return <NotiCtx.Provider value={value}>{children}</NotiCtx.Provider>;
}

export const usePrNoti = () => useContext(NotiCtx);

/** 숫자 배지 + 결과 점. n 이 0 이고 점도 없으면 아무것도 안 그린다 */
export function NotiBadge({ n = 0, dot = false, className = '' }) {
  if (!n && !dot) return null;
  return (
    <span className={`nbadge-wrap ${className}`}>
      {n > 0 && <span className="nbadge" aria-label={`리뷰할 PR ${n}건`}>{n > 99 ? '99+' : n}</span>}
      {dot && <span className="ndot" role="img" aria-label="내 PR에 새 결과가 있어요">●</span>}
    </span>
  );
}
