/* [담당 2] 팀 상세 — /teams/:teamId
   ?modal=edit-team | delete-team  ?member=:userId
   - 팀 이름·설명·팀원 확인 (팀원 줄을 누르면 팀원 정보 모달)
   - 팀 생성자만: 팀원 추가(가입된 이메일 → 바로 추가)·삭제, 정보 수정(Could), 팀 삭제
   - 생성자 본인 줄에는 삭제 버튼이 없다 */
import { useState } from 'react';
import { addMember, removeMember } from '../../api/teams';
import { useTeam } from '../../layouts/TeamLayout';
import useQuery from '../../hooks/useQuery';
import { useToast } from '../../components/Toast';
import ListState from '../../components/ListState';
import Field from '../../components/Field';
import Icon from '../../components/Icon';
import { Avatar } from '../../components/Who';
import { formatDate } from '../../utils/format';
import { checkEmail } from '../../utils/validate';
import { EditTeamModal, DeleteTeamModal, MemberModal } from './TeamModals';

function AddMemberBox({ teamId, onAdded }) {
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    const fe = checkEmail(email);
    setErr(fe);
    if (fe) return;
    setBusy(true);
    try {
      const m = await addMember(teamId, { email: email.trim() });
      toast(`${m.nickname}님을 팀원으로 추가했어요.`);
      setEmail('');
      onAdded();
    } catch (er) { setErr(er.message); } finally { setBusy(false); }
  };
  return (
    <form className="addbox" onSubmit={submit} noValidate>
      <Field id="add-member-email" label="팀원 추가" type="email" placeholder="가입된 사용자의 이메일" value={email} error={err}
        onChange={(e) => setEmail(e.target.value)} />
      <button className="btn btn-ink" type="submit" disabled={busy}><Icon name="plus" />{busy ? '추가 중…' : '추가'}</button>
    </form>
  );
}

export default function TeamDetailPage() {
  const { team, teamId, members, membersLoading, isOwner, me, reloadTeam, reloadMembers } = useTeam();
  const [q, setQuery] = useQuery();
  const toast = useToast();
  const [removing, setRemoving] = useState(null);
  const owner = members.find((m) => m.role === 'OWNER');
  const modal = q.get('modal');
  const memberOpen = members.find((m) => String(m.id) === q.get('member'));
  const refreshAll = () => { reloadMembers(); reloadTeam(); };

  const doRemove = async (m) => {
    setRemoving(m.id);
    try {
      await removeMember(teamId, m.id);
      toast(`${m.nickname}님을 팀에서 삭제했어요.`);
      refreshAll();
    } catch (err) { toast(err.message); } finally { setRemoving(null); }
  };

  return (
    <>
      <div className="pagehead">
        <div><h2 className="ko">팀 상세</h2><p className="muted">팀 정보와 팀원을 확인해요. 팀원 추가와 삭제는 팀 생성자만 할 수 있어요.</p></div>
      </div>
      <div className="twocol">
        <div className="panel">
          <div className="panel-head"><span>팀 정보</span></div>
          <div className="pad">
            <dl className="kv">
              <dt>팀 이름</dt><dd><b>{team.name}</b></dd>
              <dt>설명</dt><dd>{team.description || <span className="muted">설명이 없어요.</span>}</dd>
              <dt>팀원</dt><dd>{team.memberCount ?? members.length}명</dd>
              <dt>팀 생성자</dt><dd>{owner ? owner.nickname : '-'}</dd>
              {team.createdAt && <><dt>만든 날</dt><dd>{formatDate(team.createdAt)}</dd></>}
            </dl>
            {isOwner ? (
              <div className="rowbtns" style={{ marginTop: 16 }}>
                <button className="btn btn-sm" type="button" onClick={() => setQuery({ modal: 'edit-team' })}>정보 수정</button>
                <button className="btn btn-sm btn-no" type="button" id="teamDelBtn" onClick={() => setQuery({ modal: 'delete-team' })}><Icon name="trash" />팀 삭제</button>
              </div>
            ) : (
              <p className="only-note" style={{ marginTop: 16 }}><Icon name="team" />팀 정보 수정과 팀원 관리는 팀 생성자만 할 수 있어요.</p>
            )}
          </div>
        </div>

        <div className="panel">
          <div className="panel-head"><span>팀원 {members.length}명</span></div>
          <div className="pad">
            <ListState loading={membersLoading && !members.length} empty={!membersLoading && !members.length} emptyText="팀원이 없어요.">
              <ul className="members" id="memberList">
                {members.map((m) => (
                  <li key={m.id} className="member" onClick={(e) => { if (!e.target.closest('button')) setQuery({ member: m.id }); }}>
                    <Avatar user={m} />
                    <span><b>{m.nickname}</b>{m.id === me?.id ? ' (나)' : ''} <span className="em">{m.email}</span></span>
                    <span className={`badge ${m.role === 'OWNER' ? 'pri' : ''}`}>{m.role === 'OWNER' ? '팀 생성자' : '팀원'}</span>
                    <span>
                      {isOwner && m.role !== 'OWNER' && (
                        <button className="btn btn-sm" type="button" data-remove="member" disabled={removing === m.id}
                          aria-label={`${m.nickname} 팀원 삭제`} onClick={() => doRemove(m)}><Icon name="trash" />삭제</button>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </ListState>
            {isOwner && <AddMemberBox teamId={teamId} onAdded={refreshAll} />}
          </div>
        </div>
      </div>

      {isOwner && modal === 'edit-team' && (
        <EditTeamModal team={team} onClose={() => setQuery({ modal: null })} onSaved={() => { setQuery({ modal: null }); reloadTeam(); }} />
      )}
      {isOwner && modal === 'delete-team' && <DeleteTeamModal team={team} onClose={() => setQuery({ modal: null })} />}
      {memberOpen && <MemberModal member={memberOpen} onClose={() => setQuery({ member: null })} />}
    </>
  );
}
