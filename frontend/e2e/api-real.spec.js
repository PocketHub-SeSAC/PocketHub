// API 테스트(실서버 모드): 목업을 끄고 환경변수의 API 주소로 요청하는지, 토큰 헤더·응답 처리를 가짜 서버로 확인한다.
import { test, expect, expectToast } from './helpers';

const API = 'http://api.test';
const ME = { id: 1, email: 'real@example.com', nickname: '실서버', profileIcon: null };
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
};

/** api.test 로 가는 요청을 가로채 기록하고, handler 가 돌려준 [상태, 본문]으로 응답한다 */
async function fakeServer(page, handler) {
  const calls = [];
  await page.route(`${API}/**`, async (route) => {
    const req = route.request();
    if (req.method() === 'OPTIONS') { await route.fulfill({ status: 204, headers: CORS }); return; }
    const url = new URL(req.url());
    calls.push({ method: req.method(), path: url.pathname, auth: req.headers().authorization || '', body: req.postData() });
    const [status, body] = handler(req.method(), url.pathname) || [404, { success: false, message: '찾을 수 없습니다.' }];
    await route.fulfill({ status, headers: { ...CORS, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  });
  return calls;
}

const ok = (data) => [200, { success: true, data, message: 'OK' }];

test('로그인은 API 주소로 요청하고, 이후 요청에 Bearer 토큰을 붙인다', async ({ page }) => {
  const calls = await fakeServer(page, (method, path) => {
    if (method === 'POST' && path === '/api/v1/auth/login') return ok({ accessToken: 'real-token', member: ME });
    if (method === 'GET' && path === '/api/v1/members/me') return ok(ME);
    if (method === 'GET' && path === '/api/v1/teams') return ok([]);
    return null;
  });

  await page.goto('/auth?tab=login');
  // 실서버 모드에서는 데모 계정을 미리 채우지 않는다
  await expect(page.getByLabel('이메일')).toHaveValue('');
  await expect(page.getByText('데모 계정')).toHaveCount(0);
  await page.getByLabel('이메일').fill('real@example.com');
  await page.getByLabel('비밀번호').fill('password123');
  await page.getByRole('button', { name: '로그인', exact: true }).click();

  await expect(page).toHaveURL(/\/teams$/);
  await expectToast(page, '실서버님, 반가워요!');
  await expect(page.getByText('아직 소속된 팀이 없어요.')).toBeVisible();

  const loginCall = calls.find((c) => c.path === '/api/v1/auth/login');
  expect(loginCall.auth).toBe('');
  expect(JSON.parse(loginCall.body)).toEqual({ email: 'real@example.com', password: 'password123' });
  const teamsCall = calls.find((c) => c.path === '/api/v1/teams');
  expect(teamsCall.auth).toBe('Bearer real-token');
});

test('404 응답은 "찾을 수 없습니다." 후 메인으로 보낸다', async ({ page }) => {
  await fakeServer(page, (method, path) => {
    if (method === 'GET' && path === '/api/v1/members/me') return ok(ME);
    if (method === 'GET' && path === '/api/v1/teams') return ok([]);
    return null;
  });
  await page.addInitScript(() => localStorage.setItem('pockethub.token', 'real-token'));
  await page.goto('/teams/99');
  await expect(page).toHaveURL(/\/$/);
  await expectToast(page, '찾을 수 없습니다.');
});

test('서버에 연결하지 못하면 오류 문구와 다시 시도를 보여준다', async ({ page }) => {
  let down = true;
  await page.route(`${API}/**`, async (route) => {
    const req = route.request();
    if (req.method() === 'OPTIONS') { await route.fulfill({ status: 204, headers: CORS }); return; }
    if (down) { await route.abort('connectionrefused'); return; }
    const path = new URL(req.url()).pathname;
    const body = path === '/api/v1/members/me' ? ME : [];
    await route.fulfill({ status: 200, headers: { ...CORS, 'Content-Type': 'application/json' }, body: JSON.stringify({ success: true, data: body }) });
  });
  await page.addInitScript(() => localStorage.setItem('pockethub.token', 'real-token'));
  await page.goto('/teams');
  await expect(page.getByText('서버에 연결하지 못했어요. 네트워크를 확인해 주세요.')).toBeVisible();
  down = false;
  await page.getByRole('button', { name: '다시 시도' }).click();
  await expect(page.getByText('아직 소속된 팀이 없어요.')).toBeVisible();
});
