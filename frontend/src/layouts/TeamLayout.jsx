import { createContext, useContext, useMemo } from 'react';
import { Outlet, useParams } from 'react-router-dom';
import { getTeam, getMembers } from '../api/teams';
import { useAuth } from '../auth/AuthContext';
import useAsync from '../hooks/useAsync';
import TeamNav from '../components/TeamNav';
import ListState from '../components/ListState';
import Page from './Page';

/* 팀 화면 공통: 팀(API-007)·팀원(API-010)을 불러와 팀 메뉴와 함께 보여준다.
   소속되지 않은 팀이면 API 가 404 → 공통 처리("찾을 수 없습니다." 후 메인으로) */
const TeamCtx = createContext(null);
export const useTeam = () => useContext(TeamCtx);

export default function TeamLayout() {
  const { teamId } = useParams();
  const { user } = useAuth();
  const team = useAsync(() => getTeam(teamId), [teamId]);
  const members = useAsync(() => getMembers(teamId), [teamId]);

  const value = useMemo(() => {
    if (!team.data) return null;
    const list = members.data || [];
    return {
      teamId: String(team.data.id),
      team: team.data,
      members: list,
      membersLoading: members.loading,
      me: user,
      isOwner: !!user && team.data.ownerId === user.id,
      memberById: (id) => list.find((m) => m.id === id) || null,
      reloadTeam: () => team.reload(true),
      reloadMembers: () => members.reload(true),
    };
  }, [team, members, user]);

  if (!value) {
    return <Page><ListState loading={team.loading} error={team.error} onRetry={() => team.reload()} /></Page>;
  }
  return (
    <TeamCtx.Provider value={value}>
      <TeamNav team={value.team} />
      <Page><Outlet /></Page>
    </TeamCtx.Provider>
  );
}
