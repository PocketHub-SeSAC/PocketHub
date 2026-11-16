// 동작 테스트(추가 기능): 프로필 아이콘, PR 알림 배지, 테마 저장, 마이페이지 이동을 확인한다.
import { test, expect, login, expectToast } from './helpers';

test.describe('추가 기능', () => {
  test('프로필 아이콘을 바꾸면 상단 바에 보인다', async ({ page }) => {
    await login(page);
    await page.getByRole('button', { name: '내 정보 보기: 새싹' }).click();
    await expect(page).toHaveURL(/panel=me/);
    await page.getByRole('button', { name: '아이콘 바꾸기' }).click();
    await expect(page).toHaveURL(/modal=profile-icon/);
    await page.getByRole('button', { name: '고양이' }).click();
    await expectToast(page, '프로필 아이콘을 고양이(으)로 바꿨어요.');
    await expect(page.locator('.appbar .nick .av')).toHaveAttribute('title', '새싹 (고양이)');
  });

  test('PR 알림 배지를 누르면 마이페이지 리뷰 영역으로 간다', async ({ page }) => {
    await login(page);
    const badge = page.locator('.appbar .nbadge');
    await expect(badge).toHaveText('2');
    await expect(page.locator('.teamnav')).toHaveCount(0);
    await page.goto('/teams/1');
    await expect(page.locator('.teamnav .nbadge')).toHaveText('2');
    await page.locator('.nbadge-link').click();
    await expect(page).toHaveURL(/\/me#review$/);
    await expect(page.locator('#review')).toBeInViewport();
    await expect(page.locator('#review .me-link')).toHaveCount(2);
  });

  test('내 PR이 승인되면 PR 탭에 점이 생기고 들어가면 사라진다', async ({ page }) => {
    await login(page);
    // 목업 조작판에서 도토리(PR #11 리뷰어)로 바꿔 새싹의 PR #11 을 승인한다
    await page.goto('/teams/1?dev');
    await page.locator('.mockbar').getByRole('button', { name: '도토리' }).click();
    await page.goto('/teams/1/pulls/11?status=waiting');
    await page.getByRole('button', { name: '승인', exact: true }).click();
    await expect(page.locator('.stamp')).toContainText('승인됨');
    await page.locator('.mockbar').getByRole('button', { name: '새싹' }).click();
    await page.goto('/teams/1');
    await expect(page.locator('.teamnav .ndot')).toBeVisible();
    await page.locator('.teamnav').getByRole('link', { name: /PR/ }).click();
    await expect(page.locator('.teamnav .ndot')).toHaveCount(0);
  });

  test('테마를 고르면 새로고침해도 유지된다', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: '핑크 테마' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'pink');
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'pink');
    await expect(page.getByRole('button', { name: '핑크 테마' })).toHaveAttribute('aria-pressed', 'true');
  });

  test('마이페이지 항목을 누르면 해당 상세로 간다', async ({ page }) => {
    await login(page);
    await page.goto('/me');
    await page.locator('#tasks .me-link', { hasText: '로그인 API 명세 작성' }).click();
    await expect(page).toHaveURL(/\/teams\/1\/tasks\?task=4$/);
    await expect(page.getByRole('complementary', { name: 'Task 상세' })).toBeVisible();
  });
});
