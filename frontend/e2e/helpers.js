// E2E 공통 도구: 시간 고정, 목업 로그인, 화면이 다 그려진 뒤 스크린샷 비교.
import { test as base, expect } from '@playwright/test';

// 목업 데이터의 마감일·날짜 표시가 실행 날짜에 따라 바뀌지 않게 시각을 고정한다
const FIXED_NOW = new Date('2026-11-12T10:00:00+09:00');

export const test = base.extend({
  page: async ({ page }, use) => {
    await page.clock.setFixedTime(FIXED_NOW);
    await use(page);
  },
});

export { expect };

/** 목업 데모 계정(새싹)으로 로그인한다. 로그인 칸은 목업 모드에서 미리 채워져 있다 */
export async function login(page) {
  await page.goto('/auth?tab=login');
  await page.getByRole('button', { name: '로그인', exact: true }).click();
  await page.waitForURL('**/teams');
  await expect(page.getByRole('heading', { name: '내 팀' })).toBeVisible();
}

/** 불러오는 중 표시와 글꼴 로딩이 끝난 뒤 전체 화면을 기준 스크린샷과 비교한다 */
export async function snap(page, name) {
  await expect(page.locator('.state-box.loading')).toHaveCount(0);
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => document.fonts.ready);
  await expect(page).toHaveScreenshot(`${name}.png`, { fullPage: true });
}

/** 알림(toast) 문구 확인 */
export async function expectToast(page, text) {
  await expect(page.locator('#toast')).toHaveText(text);
}
