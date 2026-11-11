/* [담당 5] PR — /teams/:teamId/pulls?status=waiting|approved|closed
                /teams/:teamId/pulls/:prId   ?modal=new-pr   ?modal=reject (거부 사유)
   왼쪽: 상태 탭 + PR 목록 / 오른쪽: 고른 PR 상세 */
import { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getPulls } from '../../api/pulls';
import { useTeam } from '../../layouts/TeamLayout';
import useAsync from '../../hooks/useAsync';
import useQuery from '../../hooks/useQuery';
import ListState from '../../components/ListState';
import Icon from '../../components/Icon';
import Who from '../../components/Who';
import { formatDate } from '../../utils/format';
import PullDetail, { STATUS } from './PullDetail';
import NewPullModal from './NewPullModal';
import { usePrNoti } from './prNoti';

const TABS = ['waiting', 'approved', 'closed'];
const EMPTY = { waiting: '리뷰를 기다리는 PR이 없어요.', approved: '아직 승인된 PR이 없어요.', closed: '종료된 PR이 없어요.' };

export default function PullsPage() {
  const { teamId, me, members } = useTeam();
  const { prId } = useParams();
  const navigate = useNavigate();
  const [q, setQuery] = useQuery();
  const raw = q.get('status');
  const status = TABS.includes(raw) ? raw : 'waiting';
  const lists = useAsync(async () => {
    const [waiting, approved, closed] = await Promise.all(TABS.map((s) => getPulls(teamId, s)));
    return { waiting, approved, closed };
  }, [teamId]);
  const base = `/teams/${teamId}/pulls`;
  const noti = usePrNoti();
  const decidedKey = (noti.byTeam[String(teamId)]?.decided || []).join();
  const { markSeen } = noti;
  // PR 탭에 들어오면 내 PR 의 승인·거부 결과를 확인한 것으로 기록 → 점(●) 사라짐
  useEffect(() => { if (decidedKey) markSeen(teamId); }, [decidedKey, teamId, markSeen]);

  // 주소에 상태가 없으면 채우고, 고른 PR 이 다른 탭에 있으면 그 탭으로 맞춘다
  const owner = lists.data && prId ? TABS.find((s) => lists.data[s].some((p) => String(p.id) === prId)) : null;
  useEffect(() => {
    if (owner && owner !== raw) setQuery({ status: owner }, { replace: true });
    else if (!owner && !TABS.includes(raw) && (!prId || lists.data)) setQuery({ status: 'waiting' }, { replace: true });
  }, [owner, raw, prId, lists.data, setQuery]);

  const items = lists.data ? lists.data[status] : [];
  // 탭에 보이는 숫자는 하나만: 내가 리뷰할 리뷰 대기 수 (팀 메뉴 PR 알림 배지와 같은 값, 0이면 숨김)
  const myReview = lists.data ? lists.data.waiting.filter((p) => p.reviewers.some((r) => r.id === me.id)).length : 0;

  return (
    <>
      <div className="pagehead">
        <div><h2>PR</h2><p className="muted">왼쪽에서 PR을 고르면 오른쪽에 내용이 보여요. 리뷰는 누구나, 승인·거부는 지정된 리뷰어만 할 수 있어요.</p></div>
        <button className="btn btn-ink" type="button" onClick={() => setQuery({ modal: 'new-pr' })}><Icon name="plus" />새 PR</button>
      </div>

      <div className="pr-split">
        <div>
          <div className="tabs" role="tablist">
            {TABS.map((s) => (
              <Link key={s} className="tab" role="tab" to={`${base}?status=${s}`} aria-selected={status === s} data-tab={s}>
                {STATUS[s][0]}
                {s === 'waiting' && myReview > 0 && <span className="nbadge" aria-label={`내가 리뷰할 PR ${myReview}건`}>{myReview}</span>}
              </Link>
            ))}
          </div>
          <ListState loading={lists.loading} error={lists.error} onRetry={() => lists.reload()} empty={lists.data && !items.length} emptyText={EMPTY[status]}>
            <div className="pr-list">
              {items.map((p) => (
                <Link key={p.id} className={`pr pr-card ${STATUS[p.status][2]} ${String(p.id) === prId ? 'sel' : ''}`} to={`${base}/${p.id}?status=${p.status}`}
                  aria-current={String(p.id) === prId ? 'true' : undefined}>
                  <span className="no">#{p.id}</span>
                  <h3>{p.title}</h3>
                  <div className="meta">
                    <Who user={p.author} me={p.author?.id === me.id} />
                    <span className="muted">리뷰어 {p.reviewers.map((r) => r.nickname).join(', ')}</span>
                    {p.reviewers.some((r) => r.id === me.id) && p.status === 'waiting' && <span className="badge pri">내 리뷰 차례</span>}
                  </div>
                  <div className="meta">
                    {p.task && <span className="badge"><Icon name="task" size={10} />{p.task.title}</span>}
                    <span className="muted">리뷰 {p.reviewCount} · {formatDate(p.createdAt)}</span>
                  </div>
                </Link>
              ))}
            </div>
          </ListState>
        </div>

        <div>
          {prId ? (
            <PullDetail key={prId} teamId={teamId} prId={prId} me={me}
              rejectOpen={q.get('modal') === 'reject'} setRejectOpen={(o) => setQuery({ modal: o ? 'reject' : null })}
              onChanged={() => { lists.reload(true); noti.refresh(); }} />
          ) : (
            <div className="state-box"><Icon name="pr" size={27} /><span className="muted">왼쪽 목록에서 PR을 고르면 내용이 보여요.</span></div>
          )}
        </div>
      </div>

      {q.get('modal') === 'new-pr' && (
        <NewPullModal teamId={teamId} me={me} members={members} onClose={() => setQuery({ modal: null })}
          onCreated={(pr) => { lists.reload(true); noti.refresh(); navigate(`${base}/${pr.id}?status=waiting`); }} />
      )}
    </>
  );
}
