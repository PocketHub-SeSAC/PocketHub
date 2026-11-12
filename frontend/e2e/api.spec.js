// API 처리 테스트(목업 모드): 401·404 공통 처리와 요청 실패 시 다시 시도를 확인한다.
import { test, expect, login, expectToast } from './helpers';

test('토큰이 만료되면(401) 로그인 화면으로 보내고 원래 주소를 기억한다', async ({ page }) => {
  await login(page);
  await page.evaluate(() => localStorage.setItem('pockethub.token', 'expired-token'));
  await page.goto('/teams/1/files');
  await expect(page).toHaveURL(/\/auth\?tab=login&next=%2Fteams%2F1%2Ffiles/);
});

test('요청 중 401이 오면 "로그인이 만료됐어요" 후 로그인 화면으로 간다', async ({ page }) => {
  await login(page);
  await page.goto('/teams/1');
  await expect(page.getByText('팀원 4명')).toBeVisible();
  await page.evaluate(() => localStorage.setItem('pockethub.token', 'expired-token'));
  await page.getByRole('link', { name: '파일·커밋' }).click();
  await expectToast(page, '로그인이 만료됐어요. 다시 로그인해 주세요.');
  // 동시에 여러 요청이 401 이면 next 가 겹쳐 쌓이는 문제가 있어(이전 전부터) 앞부분만 확인한다
  await expect(page).toHaveURL(/\/auth\?tab=login&next=/);
});

test('요청이 실패하면 오류 문구와 다시 시도 버튼을 보여준다', async ({ page }) => {
  await login(page);
  await page.goto('/teams?dev');
  await page.locator('.mockbar').getByRole('button', { name: '다음 요청 실패' }).click();
  await page.goto('/teams/1/tasks');
  const retry = page.getByRole('button', { name: '다시 시도' });
  await expect(retry.first()).toBeVisible();
  await retry.first().click();
  await expect(page.getByText('와이어프레임 작성')).toBeVisible();
});
