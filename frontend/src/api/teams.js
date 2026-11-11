/* [담당 2] 팀·팀원 API (API-005 ~ 012) */
import { request } from './client';
import { normalizeTeam, normalizeTeams, normalizeTeamMember, normalizeTeamMembers } from './adapter';

export const TEAMS_API = {
  create:       { key: 'teams.create',       method: 'POST',   path: '/api/v1/teams' },                            // API-005
  list:         { key: 'teams.list',         method: 'GET',    path: '/api/v1/teams' },                            // API-006
  detail:       { key: 'teams.detail',       method: 'GET',    path: '/api/v1/teams/{teamId}' },                   // API-007
  update:       { key: 'teams.update',       method: 'PATCH',  path: '/api/v1/teams/{teamId}' },                   // API-008
  remove:       { key: 'teams.remove',       method: 'DELETE', path: '/api/v1/teams/{teamId}' },                   // API-009
  members:      { key: 'teams.members',      method: 'GET',    path: '/api/v1/teams/{teamId}/members' },           // API-010
  addMember:    { key: 'teams.addMember',    method: 'POST',   path: '/api/v1/teams/{teamId}/members' },           // API-011
  removeMember: { key: 'teams.removeMember', method: 'DELETE', path: '/api/v1/teams/{teamId}/members/{userId}' },  // API-012
};

export const createTeam = ({ name, description }) =>
  request(TEAMS_API.create, { body: { name, description } }).then(normalizeTeam);

export const getTeams = () => request(TEAMS_API.list).then(normalizeTeams);

export const getTeam = (teamId) => request(TEAMS_API.detail, { params: { teamId } }).then(normalizeTeam);

export const updateTeam = (teamId, { name, description }) =>
  request(TEAMS_API.update, { params: { teamId }, body: { name, description } }).then(normalizeTeam);

export const deleteTeam = (teamId) => request(TEAMS_API.remove, { params: { teamId } });

export const getMembers = (teamId) => request(TEAMS_API.members, { params: { teamId } }).then(normalizeTeamMembers);

/** 가입된 이메일로 바로 추가 */
export const addMember = (teamId, { email }) =>
  request(TEAMS_API.addMember, { params: { teamId }, body: { email } }).then(normalizeTeamMember);

export const removeMember = (teamId, userId) =>
  request(TEAMS_API.removeMember, { params: { teamId, userId } });
