/* [담당 2] 팀 목록 — /teams , /teams?modal=create-team
   내 팀 카드(이름·설명·팀원·내 역할). 카드 어디를 눌러도 팀 상세로 이동. */
import { Link, useNavigate } from 'react-router-dom';
import { getTeams } from '../../api/teams';
import { useAuth } from '../../auth/AuthContext';
import useAsync from '../../hooks/useAsync';
import useQuery from '../../hooks/useQuery';
import ListState from '../../components/ListState';
import Icon from '../../components/Icon';
import { Avatar } from '../../components/Who';
import CreateTeamModal from './CreateTeamModal';

export default function TeamListPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [q, setQuery] = useQuery();
  const teams = useAsync(getTeams, []);
  const open = () => setQuery({ modal: 'create-team' });

  return (
    <>
      <div className="pagehead">
        <div><h2 className="ko">내 팀</h2><p className="muted">소속된 팀을 고르거나 새 팀을 만들어요.</p></div>
        <button className="btn btn-ink" type="button" onClick={open}><Icon name="plus" />팀 만들기</button>
      </div>

      <ListState loading={teams.loading} error={teams.error} onRetry={() => teams.reload()}
        empty={teams.data && teams.data.length === 0}
        emptyText="아직 소속된 팀이 없어요. 새 팀을 만들거나, 팀 생성자에게 초대를 부탁해 보세요."
        emptyAction={<button className="btn" type="button" onClick={open}><Icon name="plus" />팀 만들기</button>}>
        <div className="teams">
          {(teams.data || []).map((t) => {
            const owner = t.ownerId === user?.id;
            return (
              <article key={t.id} className="panel team-card" onClick={(e) => { if (!e.target.closest('a')) navigate(`/teams/${t.id}`); }}>
                <div className="pad">
                  <div className="rowbtns" style={{ justifyContent: 'space-between' }}>
                    <h3>{t.name}</h3>
                    <span className={`badge ${owner ? 'pri' : ''}`}>{owner ? '팀 생성자' : '팀원'}</span>
                  </div>
                  <p className="muted">{t.description || '설명이 없어요.'}</p>
                  <div className="rowbtns">
                    <div className="avs" aria-label={`팀원 ${t.memberCount}명`}>{t.members.slice(0, 6).map((m) => <Avatar key={m.id} user={m} />)}</div>
                    <span className="sub-hint">팀원 {t.memberCount}명</span>
                  </div>
                  <div><Link className="btn btn-sm" to={`/teams/${t.id}`}>들어가기</Link></div>
                </div>
              </article>
            );
          })}
        </div>
      </ListState>

      {q.get('modal') === 'create-team' && <CreateTeamModal onClose={() => setQuery({ modal: null })} />}
    </>
  );
}
