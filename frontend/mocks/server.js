/* 브라우저 안 가짜 서버. services/client.js 가 NEXT_PUBLIC_USE_MOCK=true 일 때 route.key 로 핸들러를 찾는다.
   (경로 문자열은 services/*.js 에만 있다) */
import { getDb, saveDb } from './db';
import { MockHttpError } from './util';
import { handlers as auth } from '@/mocks/handlers/auth';
import { handlers as teams } from '@/mocks/handlers/teams';
import { handlers as files } from '@/mocks/handlers/files';
import { handlers as tasks } from '@/mocks/handlers/tasks';
import { handlers as pulls } from '@/mocks/handlers/pulls';

const HANDLERS = { ...auth, ...teams, ...files, ...tasks, ...pulls };

/* ?dev 조작판에서 바꾸는 값 (sessionStorage 에 보관) */
const FLAG_KEY = 'pockethub.mockflags';
export function getDevFlags() {
  try { return { latency: 250, failNext: false, ...JSON.parse(sessionStorage.getItem(FLAG_KEY) || '{}') }; }
  catch { return { latency: 250, failNext: false }; }
}
export function setDevFlags(patch) {
  const next = { ...getDevFlags(), ...patch };
  try { sessionStorage.setItem(FLAG_KEY, JSON.stringify(next)); } catch { /* 무시 */ }
  return next;
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function userFromToken(db, authHeader) {
  const m = /^Bearer (.+)$/.exec(authHeader || '');
  if (!m) return null;
  const userId = db.sessions[m[1]];
  return userId ? db.users.find((u) => u.id === userId) || null : null;
}

// 응답은 { success, data, message } 껍데기로 감싸서 adapter.unwrap 이 벗기게 한다
export async function mockFetch(route, req) {
  const flags = getDevFlags();
  await wait(flags.latency);

  const handler = HANDLERS[route.key];
  if (!handler) return { status: 501, data: { success: false, message: `목업에 아직 없는 API예요: ${route.method} ${req.path}` } };

  if (flags.failNext) {
    setDevFlags({ failNext: false });
    return { status: 500, data: { success: false, message: '(목업) 서버 오류를 흉내 냈어요. 다시 시도해 주세요.' } };
  }

  const db = getDb();
  let user = null;
  let token = null;
  if (route.auth !== false) {
    user = userFromToken(db, req.headers.Authorization);
    if (!user) return { status: 401, data: { success: false, message: '로그인이 필요해요. 다시 로그인해 주세요.' } };
    token = req.headers.Authorization.slice(7);
  }

  try {
    const out = handler({ ...req, db, user, token });
    saveDb();
    if (out && out.blob) return { status: 200, blob: out.blob, filename: out.filename };
    const status = (out && out.status) || 200;
    return { status, data: status === 204 ? null : { success: true, data: out ? out.data : null } };
  } catch (e) {
    if (e instanceof MockHttpError) return { status: e.status, data: { success: false, message: e.message } };
    console.error('[mock]', e);
    return { status: 500, data: { success: false, message: '(목업) 처리 중 오류가 났어요.' } };
  }
}
