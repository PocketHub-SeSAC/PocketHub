/* [담당 2] 목업: 팀·팀원 */
import { nextId } from '@/mocks/db';
import { fail, ok, created, noContent, publicUser, requireMember, str, toId, now, EMAIL_RE } from '@/mocks/util';

const memberView = (db, teamId, m) => ({
  ...publicUser(db, m.userId),
  role: db.teams.find((t) => t.id === teamId).ownerId === m.userId ? 'OWNER' : 'MEMBER',
  joinedAt: m.joinedAt,
});

const teamView = (db, t) => {
  const ms = db.members.filter((m) => m.teamId === t.id);
  return {
    id: t.id, name: t.name, description: t.description, ownerId: t.ownerId, createdAt: t.createdAt,
    memberCount: ms.length,
    members: ms.map((m) => memberView(db, t.id, m)),
  };
};

const requireOwner = (team, user, what) => { if (team.ownerId !== user.id) fail(403, `팀 생성자만 ${what} 수 있어요.`); };

function validTeamInput(body) {
  const name = str(body?.name);
  const description = str(body?.description);
  if (!name) fail(400, '팀 이름을 입력해 주세요.');
  if (name.length > 30) fail(400, '팀 이름은 30자 이하로 입력해 주세요.');
  if (description.length > 200) fail(400, '설명은 200자 이하로 입력해 주세요.');
  return { name, description };
}

export const handlers = {
  'teams.create': ({ db, user, body }) => {
    const { name, description } = validTeamInput(body);
    const team = { id: nextId(db, 'team'), name, description, ownerId: user.id, createdAt: now() };
    db.teams.push(team);
    db.members.push({ teamId: team.id, userId: user.id, joinedAt: now() });
    return created(teamView(db, team));
  },

  'teams.list': ({ db, user }) => {
    const ids = db.members.filter((m) => m.userId === user.id).map((m) => m.teamId);
    return ok(db.teams.filter((t) => ids.includes(t.id)).map((t) => teamView(db, t)));
  },

  'teams.detail': ({ db, user, params }) => ok(teamView(db, requireMember(db, params.teamId, user))),

  'teams.update': ({ db, user, params, body }) => {
    const team = requireMember(db, params.teamId, user);
    requireOwner(team, user, '팀 정보를 수정할');
    Object.assign(team, validTeamInput(body));
    return ok(teamView(db, team));
  },

  'teams.remove': ({ db, user, params }) => {
    const team = requireMember(db, params.teamId, user);
    requireOwner(team, user, '팀을 삭제할');
    const id = team.id;
    const fileIds = db.files.filter((f) => f.teamId === id).map((f) => f.id);
    const prIds = db.pulls.filter((p) => p.teamId === id).map((p) => p.id);
    db.teams = db.teams.filter((t) => t.id !== id);
    db.members = db.members.filter((m) => m.teamId !== id);
    db.files = db.files.filter((f) => f.teamId !== id);
    db.versions = db.versions.filter((v) => !fileIds.includes(v.fileId));
    db.commits = db.commits.filter((c) => c.teamId !== id);
    db.tasks = db.tasks.filter((t) => t.teamId !== id);
    db.pulls = db.pulls.filter((p) => p.teamId !== id);
    db.reviews = db.reviews.filter((r) => !prIds.includes(r.prId));
    return noContent();
  },

  'teams.members': ({ db, user, params }) => {
    const team = requireMember(db, params.teamId, user);
    return ok(db.members.filter((m) => m.teamId === team.id).map((m) => memberView(db, team.id, m)));
  },

  'teams.addMember': ({ db, user, params, body }) => {
    const team = requireMember(db, params.teamId, user);
    requireOwner(team, user, '팀원을 추가할');
    const email = str(body?.email).toLowerCase();
    if (!email) fail(400, '추가할 사용자의 이메일을 입력해 주세요.');
    if (!EMAIL_RE.test(email)) fail(400, '이메일 형식이 올바르지 않아요. 예: you@example.com');
    const target = db.users.find((u) => u.email === email);
    // 404 는 "팀을 찾을 수 없음"과 헷갈리지 않게 400 으로 돌려준다
    if (!target) fail(400, '가입되지 않은 이메일이에요. 먼저 회원가입을 부탁해 주세요.');
    if (db.members.some((m) => m.teamId === team.id && m.userId === target.id)) fail(409, '이미 이 팀의 팀원이에요.');
    const m = { teamId: team.id, userId: target.id, joinedAt: now() };
    db.members.push(m);
    return created(memberView(db, team.id, m));
  },

  'teams.removeMember': ({ db, user, params }) => {
    const team = requireMember(db, params.teamId, user);
    requireOwner(team, user, '팀원을 삭제할');
    const userId = toId(params.userId);
    if (userId === team.ownerId) fail(400, '팀 생성자는 삭제할 수 없어요.');
    if (!db.members.some((m) => m.teamId === team.id && m.userId === userId)) fail(400, '이 팀의 팀원이 아니에요.');
    db.members = db.members.filter((m) => !(m.teamId === team.id && m.userId === userId));
    // 담당자로 지정돼 있던 Task 는 담당자 없음으로
    db.tasks.forEach((t) => { if (t.teamId === team.id && t.assigneeId === userId) t.assigneeId = null; });
    return noContent();
  },
};
