// 동작 테스트(회원·인증, 팀): 로그인 흐름, 팀 만들기·팀원 관리, 404 처리, 모달과 뒤로 가기를 확인한다.
import { test, expect, login, expectToast } from './helpers';

test.describe('회원·인증', () => {
  test('비로그인으로 보호된 화면에 오면 로그인 후 원래 화면으로 돌아온다', async ({ page }) => {
    await page.goto('/teams/1/tasks');
    await expect(page).toHaveURL(/\/auth\?tab=login&next=%2Fteams%2F1%2Ftasks/);
    await expectToast(page, '로그인이 필요해요. 로그인하면 보던 화면으로 돌아가요.');
    await page.getByRole('button', { name: '로그인', exact: true }).click();
    await expect(page).toHaveURL(/\/teams\/1\/tasks$/);
    await expect(page.getByRole('heading', { name: '태스크 보드' })).toBeVisible();
  });

  test('회원가입하면 로그인 탭으로 바뀌고 이메일이 채워진다', async ({ page }) => {
    await page.goto('/auth?tab=signup');
    await page.getByLabel('이메일').fill('new@example.com');
    await page.getByLabel('비밀번호').fill('password123');
    await page.getByLabel('닉네임').fill('새친구');
    await page.getByRole('button', { name: '회원가입', exact: true }).click();
    await expect(page).toHaveURL(/tab=login/);
    await expectToast(page, '가입했어요. 로그인해 주세요.');
    await expect(page.getByLabel('이메일')).toHaveValue('new@example.com');
  });

  test('틀린 비밀번호는 서버 오류 문구를 보여준다', async ({ page }) => {
    await page.goto('/auth?tab=login');
    await page.getByLabel('비밀번호').fill('wrong-password');
    await page.getByRole('button', { name: '로그인', exact: true }).click();
    await expect(page.locator('.alert[role="alert"]')).toBeVisible();
    await expect(page).toHaveURL(/\/auth/);
  });

  // 로그아웃 직후 PR 배지 갱신 요청이 401 을 받아 로그인 화면으로 가는 경우가 있어(이전 전부터)
  // 이동한 주소와 알림 문구 대신 로그인이 풀렸는지만 확인한다
  test('로그아웃하면 토큰이 지워지고 상단 바에서 내 정보가 사라진다', async ({ page }) => {
    await login(page);
    await page.getByRole('button', { name: '로그아웃' }).click();
    await expect(page.getByRole('button', { name: /내 정보 보기/ })).toHaveCount(0);
    expect(await page.evaluate(() => localStorage.getItem('pockethub.token'))).toBeNull();
  });

  test('메인 기능 카드는 비로그인이면 로그인 화면으로 보낸다', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: '파일 관리: 로그인하고 이용하기' }).click();
    await expect(page).toHaveURL(/\/auth\?tab=login$/);
    await expectToast(page, '로그인하면 이용할 수 있어요.');
  });
});

test.describe('팀', () => {
  test('팀을 만들면 새 팀 상세로 이동한다', async ({ page }) => {
    await login(page);
    await page.getByRole('button', { name: '팀 만들기' }).first().click();
    await expect(page).toHaveURL(/\/teams\?modal=create-team$/);
    await page.getByLabel('팀 이름').fill('테스트 팀');
    await page.getByRole('button', { name: '만들기', exact: true }).click();
    await expect(page).toHaveURL(/\/teams\/4$/);
    await expectToast(page, '"테스트 팀" 팀을 만들었어요.');
    await expect(page.locator('.teamnav .team-name')).toHaveText('테스트 팀');
  });

  test('예전 주소 /?modal=create-team 은 팀 목록의 팀 만들기로 보낸다', async ({ page }) => {
    await login(page);
    await page.goto('/?modal=create-team');
    await expect(page).toHaveURL(/\/teams\?modal=create-team$/);
    await expect(page.getByRole('dialog', { name: '팀 만들기' })).toBeVisible();
  });

  test('소속되지 않은 팀은 "찾을 수 없습니다." 후 메인으로 간다', async ({ page }) => {
    await login(page);
    await page.goto('/teams/3');
    await expect(page).toHaveURL(/\/$/);
    await expectToast(page, '찾을 수 없습니다.');
  });

  test('없는 주소는 "찾을 수 없습니다." 후 메인으로 간다', async ({ page }) => {
    await page.goto('/no-such-page');
    await expect(page).toHaveURL(/\/$/);
    await expectToast(page, '찾을 수 없습니다.');
  });

  test('팀원 추가와 삭제', async ({ page }) => {
    await login(page);
    await page.goto('/teams/2');
    await expect(page.locator('.only-note')).toBeVisible();
    await page.goto('/teams/1');
    await page.getByRole('button', { name: '구름 팀원 삭제' }).click();
    await expectToast(page, '구름님을 팀에서 삭제했어요.');
    await expect(page.locator('.panel-head', { hasText: '팀원 3명' })).toBeVisible();
    await page.getByLabel('팀원 추가').fill('cloud@example.com');
    await page.getByRole('button', { name: '추가', exact: true }).click();
    await expectToast(page, '구름님을 팀원으로 추가했어요.');
    await expect(page.locator('.panel-head', { hasText: '팀원 4명' })).toBeVisible();
  });

  test('모달을 열고 브라우저 뒤로 가기를 하면 닫힌다', async ({ page }) => {
    await login(page);
    await page.goto('/teams/1');
    await page.getByRole('button', { name: '정보 수정' }).click();
    await expect(page).toHaveURL(/modal=edit-team/);
    await page.goBack();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page).toHaveURL(/\/teams\/1$/);
  });
});
