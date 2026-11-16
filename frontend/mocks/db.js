/* 목업 데이터베이스 (브라우저 localStorage 에 저장 → 새로고침해도 유지)
   ?dev 조작판의 "목업 초기화"로 처음 상태로 되돌린다. */

/* 시연 시나리오 (로그인: saessak@example.com / password123)
   - 사용자 4명: 새싹(1) 달팽이(2) 도토리(3) 구름(4)
   - 팀 1 "포켓 개발팀" : 생성자 새싹, 팀원 4명  ← 거의 모든 시연
   - 팀 2 "기획 스터디" : 생성자 달팽이, 새싹은 팀원 (생성자 전용 버튼 안 보임 확인)
   - 팀 3 "비밀 프로젝트": 새싹이 소속되지 않음 → /teams/3 은 "찾을 수 없습니다."
   - 파일 여러 버전: ERD.png v1→v2, 요구사항정의서.pdf v1→v2
   - PR에 묶인 커밋 / 안 묶인 커밋(새싹의 c7·c8 → 새 PR 만들 때 고를 수 있음)
   - PR: 리뷰 대기 #10 #11 #12, 승인 #9, 종료(거부) #8 */
const KEY = 'pockethub.mockdb.v2'; // v2: 사용자 profileIcon 추가

const d = (s) => new Date(s).toISOString();

function seed() {
  return {
    seq: { user: 4, team: 3, file: 8, version: 10, commit: 11, task: 10, pull: 12, review: 4, session: 0 },
    sessions: {},
    users: [
      { id: 1, email: 'saessak@example.com', password: 'password123', nickname: '새싹', profileIcon: 'sprout' },
      { id: 2, email: 'snail@example.com', password: 'password123', nickname: '달팽이', profileIcon: 'snail' },
      { id: 3, email: 'acorn@example.com', password: 'password123', nickname: '도토리', profileIcon: 'acorn' },
      { id: 4, email: 'cloud@example.com', password: 'password123', nickname: '구름', profileIcon: 'cloud' },
    ],
    teams: [
      { id: 1, name: '포켓 개발팀', description: '요구사항 정의부터 PR 리뷰까지, 7일 프로젝트 팀', ownerId: 1, createdAt: d('2026-10-27T10:00:00+09:00') },
      { id: 2, name: '기획 스터디', description: '매주 목요일 자료를 같이 정리해요', ownerId: 2, createdAt: d('2026-10-28T19:00:00+09:00') },
      { id: 3, name: '비밀 프로젝트', description: '새싹이 소속되지 않은 팀 (접근 제어 확인용)', ownerId: 3, createdAt: d('2026-10-29T09:00:00+09:00') },
    ],
    members: [
      { teamId: 1, userId: 1, joinedAt: d('2026-10-27T10:00:00+09:00') },
      { teamId: 1, userId: 2, joinedAt: d('2026-10-27T10:05:00+09:00') },
      { teamId: 1, userId: 3, joinedAt: d('2026-10-27T10:06:00+09:00') },
      { teamId: 1, userId: 4, joinedAt: d('2026-10-27T10:07:00+09:00') },
      { teamId: 2, userId: 2, joinedAt: d('2026-10-28T19:00:00+09:00') },
      { teamId: 2, userId: 1, joinedAt: d('2026-10-28T19:10:00+09:00') },
      { teamId: 3, userId: 3, joinedAt: d('2026-10-29T09:00:00+09:00') },
      { teamId: 3, userId: 4, joinedAt: d('2026-10-29T09:01:00+09:00') },
    ],
    files: [
      { id: 1, teamId: 1, name: '회의록 초안.txt' },
      { id: 2, teamId: 1, name: '와이어프레임 시안.png' },
      { id: 3, teamId: 1, name: '기획서.pdf' },
      { id: 4, teamId: 1, name: '회의록.docx' },
      { id: 5, teamId: 1, name: 'API명세.xlsx' },
      { id: 6, teamId: 1, name: 'ERD.png' },
      { id: 7, teamId: 1, name: '요구사항정의서.pdf' },
      { id: 8, teamId: 2, name: '스터디 계획.docx' },
    ],
    versions: [
      { id: 1, fileId: 1, version: 1, size: 3_200, uploaderId: 4, commitId: 1, uploadedAt: d('2026-10-28T21:00:00+09:00') },
      { id: 2, fileId: 2, version: 1, size: 419_840, uploaderId: 4, commitId: 2, uploadedAt: d('2026-10-29T22:00:00+09:00') },
      { id: 3, fileId: 3, version: 1, size: 2_516_582, uploaderId: 1, commitId: 4, uploadedAt: d('2026-10-31T17:30:00+09:00') },
      { id: 4, fileId: 4, version: 1, size: 49_152, uploaderId: 4, commitId: 5, uploadedAt: d('2026-11-01T20:00:00+09:00') },
      { id: 5, fileId: 5, version: 1, size: 98_304, uploaderId: 1, commitId: 6, uploadedAt: d('2026-11-02T15:00:00+09:00') },
      { id: 6, fileId: 6, version: 1, size: 327_680, uploaderId: 2, commitId: 7, uploadedAt: d('2026-11-03T11:00:00+09:00') },
      { id: 7, fileId: 6, version: 2, size: 348_160, uploaderId: 2, commitId: 8, uploadedAt: d('2026-11-03T14:20:00+09:00') },
      { id: 8, fileId: 7, version: 1, size: 1_782_579, uploaderId: 1, commitId: 9, uploadedAt: d('2026-11-03T16:00:00+09:00') },
      { id: 9, fileId: 7, version: 2, size: 1_887_437, uploaderId: 1, commitId: 10, uploadedAt: d('2026-11-04T10:30:00+09:00') },
      { id: 10, fileId: 8, version: 1, size: 24_576, uploaderId: 2, commitId: 11, uploadedAt: d('2026-10-30T20:00:00+09:00') },
    ],
    commits: [
      { id: 1, teamId: 1, hash: '5e6f7a', message: '회의록 초안 업로드', type: 'UPLOAD', authorId: 4, createdAt: d('2026-10-28T21:00:00+09:00'), prId: null, excluded: false, items: [{ fileId: 1, versionId: 1, action: 'ADD' }] },
      { id: 2, teamId: 1, hash: 'e1f2a3', message: '와이어프레임 시안 업로드', type: 'UPLOAD', authorId: 4, createdAt: d('2026-10-29T22:00:00+09:00'), prId: 8, excluded: true, items: [{ fileId: 2, versionId: 2, action: 'ADD' }] },
      { id: 3, teamId: 1, hash: '0b1c2d', message: '회의록 초안 삭제', type: 'DELETE', authorId: 4, createdAt: d('2026-10-30T09:00:00+09:00'), prId: null, excluded: false, items: [{ fileId: 1, versionId: 1, action: 'DELETE' }] },
      { id: 4, teamId: 1, hash: '7a6b5c', message: '기획서 최종본 업로드', type: 'UPLOAD', authorId: 1, createdAt: d('2026-10-31T17:30:00+09:00'), prId: 9, excluded: false, items: [{ fileId: 3, versionId: 3, action: 'ADD' }] },
      { id: 5, teamId: 1, hash: '3c4d5e', message: '회의록 정리본 업로드', type: 'UPLOAD', authorId: 4, createdAt: d('2026-11-01T20:00:00+09:00'), prId: 10, excluded: false, items: [{ fileId: 4, versionId: 4, action: 'ADD' }] },
      { id: 6, teamId: 1, hash: '9f8e7d', message: 'API 명세 초안 업로드', type: 'UPLOAD', authorId: 1, createdAt: d('2026-11-02T15:00:00+09:00'), prId: 11, excluded: false, items: [{ fileId: 5, versionId: 5, action: 'ADD' }] },
      { id: 7, teamId: 1, hash: 'a1b2c3', message: 'ERD 초안 업로드', type: 'UPLOAD', authorId: 2, createdAt: d('2026-11-03T11:00:00+09:00'), prId: 12, excluded: false, items: [{ fileId: 6, versionId: 6, action: 'ADD' }] },
      { id: 8, teamId: 1, hash: 'd4e5f6', message: 'ERD 컬럼 보완', type: 'UPLOAD', authorId: 2, createdAt: d('2026-11-03T14:20:00+09:00'), prId: 12, excluded: false, items: [{ fileId: 6, versionId: 7, action: 'MODIFY' }] },
      { id: 9, teamId: 1, hash: 'b7c8d9', message: '요구사항정의서 업로드', type: 'UPLOAD', authorId: 1, createdAt: d('2026-11-03T16:00:00+09:00'), prId: null, excluded: false, items: [{ fileId: 7, versionId: 8, action: 'ADD' }] },
      { id: 10, teamId: 1, hash: 'f0e1d2', message: '요구사항정의서 화면 목록 보완', type: 'UPLOAD', authorId: 1, createdAt: d('2026-11-04T10:30:00+09:00'), prId: null, excluded: false, items: [{ fileId: 7, versionId: 9, action: 'MODIFY' }] },
      { id: 11, teamId: 2, hash: '2a3b4c', message: '스터디 계획 업로드', type: 'UPLOAD', authorId: 2, createdAt: d('2026-10-30T20:00:00+09:00'), prId: null, excluded: false, items: [{ fileId: 8, versionId: 10, action: 'ADD' }] },
    ],
    tasks: [
      { id: 1, teamId: 1, title: '와이어프레임 작성', description: '화면 7개의 와이어프레임을 만들어요.', status: 'TODO', priority: 'MEDIUM', assigneeId: 4, startDate: '2026-11-05', dueDate: '2026-11-08', createdAt: d('2026-10-28T10:00:00+09:00') },
      { id: 2, teamId: 1, title: '발표 자료 초안', description: '발표 슬라이드 초안을 만들어요.', status: 'TODO', priority: 'LOW', assigneeId: 3, startDate: '', dueDate: '2026-11-10', createdAt: d('2026-10-28T10:05:00+09:00') },
      { id: 3, teamId: 1, title: 'ERD 수정', description: '팀, 파일, Commit, PR 테이블 관계를 요구사항에 맞게 고쳐요.', status: 'DOING', priority: 'HIGH', assigneeId: 2, startDate: '2026-11-03', dueDate: '2026-11-05', createdAt: d('2026-10-29T10:00:00+09:00') },
      { id: 4, teamId: 1, title: '로그인 API 명세 작성', description: '로그인과 회원가입 API의 요청·응답 형식을 정리해요.', status: 'DOING', priority: 'HIGH', assigneeId: 1, startDate: '2026-11-02', dueDate: '2026-11-06', createdAt: d('2026-10-29T10:10:00+09:00') },
      { id: 5, teamId: 1, title: '회의록 정리', description: '지난 회의 내용을 정리해서 공유해요.', status: 'DOING', priority: 'MEDIUM', assigneeId: 4, startDate: '2026-11-01', dueDate: '2026-11-04', createdAt: d('2026-10-29T10:20:00+09:00') },
      { id: 6, teamId: 1, title: '기획서 작성', description: '프로젝트 기획서를 작성해요.', status: 'DONE', priority: 'MEDIUM', assigneeId: 1, startDate: '2026-10-27', dueDate: '2026-10-31', createdAt: d('2026-10-27T11:00:00+09:00') },
      { id: 7, teamId: 1, title: '요구사항 정의서 보완', description: '화면 목록과 기능 목록을 맞춰요.', status: 'TODO', priority: 'HIGH', assigneeId: null, startDate: '', dueDate: '', createdAt: d('2026-11-03T09:00:00+09:00') },
      { id: 8, teamId: 2, title: '다음 주 발표 주제 정하기', description: '', status: 'TODO', priority: 'MEDIUM', assigneeId: 1, startDate: '', dueDate: '2026-11-12', createdAt: d('2026-10-30T20:10:00+09:00') },
      { id: 9, teamId: 2, title: '스터디 계획 공유', description: '', status: 'DONE', priority: 'LOW', assigneeId: 2, startDate: '', dueDate: '', createdAt: d('2026-10-30T20:20:00+09:00') },
      { id: 10, teamId: 3, title: '비밀 작업', description: '', status: 'TODO', priority: 'LOW', assigneeId: 3, startDate: '', dueDate: '', createdAt: d('2026-10-29T09:10:00+09:00') },
    ],
    pulls: [
      { id: 8, teamId: 1, title: '와이어프레임 시안', description: '와이어프레임 첫 시안이에요.', authorId: 4, reviewerIds: [3], taskId: 1, commitIds: [2], status: 'CLOSED', createdAt: d('2026-10-29T22:10:00+09:00'), decidedById: 3, decidedAt: d('2026-10-30T22:05:00+09:00') },
      { id: 9, teamId: 1, title: '기획서 최종본', description: '목차와 일정을 정리한 최종본이에요.', authorId: 1, reviewerIds: [2], taskId: 6, commitIds: [4], status: 'APPROVED', createdAt: d('2026-10-31T17:40:00+09:00'), decidedById: 2, decidedAt: d('2026-10-31T18:20:00+09:00') },
      { id: 10, teamId: 1, title: '회의록 정리본 업로드', description: '11월 1일 회의 내용을 정리했어요.', authorId: 4, reviewerIds: [1], taskId: 5, commitIds: [5], status: 'WAITING', createdAt: d('2026-11-01T20:10:00+09:00'), decidedById: null, decidedAt: null },
      { id: 11, teamId: 1, title: '로그인 API 명세 초안', description: '로그인과 회원가입 API 명세 초안이에요.', authorId: 1, reviewerIds: [3], taskId: 4, commitIds: [6], status: 'WAITING', createdAt: d('2026-11-02T15:10:00+09:00'), decidedById: null, decidedAt: null },
      { id: 12, teamId: 1, title: 'ERD 초안 검토 요청', description: 'ERD 초안을 올렸어요. 팀, 파일, Commit, PR 테이블의 관계가 요구사항과 맞는지 확인 부탁드려요.', authorId: 2, reviewerIds: [1, 3], taskId: 3, commitIds: [7, 8], status: 'WAITING', createdAt: d('2026-11-03T14:30:00+09:00'), decidedById: null, decidedAt: null },
    ],
    reviews: [
      { id: 1, prId: 8, authorId: 3, content: '화면 수가 요구사항과 달라서 거부할게요.', type: 'REJECT', createdAt: d('2026-10-30T22:05:00+09:00') },
      { id: 2, prId: 9, authorId: 2, content: '목차와 일정이 잘 정리됐어요. 승인합니다.', type: 'COMMENT', createdAt: d('2026-10-31T18:20:00+09:00') },
      { id: 3, prId: 12, authorId: 3, content: 'Task 하나에 PR을 여러 개 만들 수 있는지 먼저 정하면 좋겠어요.', type: 'COMMENT', createdAt: d('2026-11-03T21:40:00+09:00') },
      { id: 4, prId: 12, authorId: 2, content: '회의에서 정하고 ERD에 반영할게요.', type: 'COMMENT', createdAt: d('2026-11-04T09:10:00+09:00') },
    ],
  };
}

let cache = null;

export function getDb() {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) { cache = JSON.parse(raw); return cache; }
  } catch { /* 저장 불가 → 메모리만 사용 */ }
  cache = seed();
  saveDb();
  return cache;
}

export function saveDb() {
  try { localStorage.setItem(KEY, JSON.stringify(cache)); } catch { /* 무시 */ }
}

/** 처음 상태로 되돌린다 (로그인 세션도 초기화) */
export function resetDb() {
  cache = seed();
  saveDb();
}

export const nextId = (db, name) => { db.seq[name] += 1; return db.seq[name]; };
