// 동작 테스트(파일·커밋, Task, PR·리뷰): 업로드·삭제, Task 생성·상태 변경, PR 생성·승인·거부를 확인한다.
import { test, expect, login, expectToast } from './helpers';

test.describe('파일·커밋', () => {
  test('파일을 올리면 커밋이 만들어지고 목록에 보인다', async ({ page }) => {
    await login(page);
    await page.goto('/teams/1/files?modal=upload');
    await page.locator('input[type="file"]').setInputFiles({ name: '테스트.txt', mimeType: 'text/plain', buffer: Buffer.from('hello') });
    await expect(page.getByLabel('커밋 메시지')).toHaveValue('테스트 업로드');
    await page.getByRole('button', { name: '업로드', exact: true }).click();
    await expect(page.locator('#toast')).toContainText('테스트.txt을(를) 올렸어요.');
    await expect(page.locator('.frow', { hasText: '테스트.txt' })).toBeVisible();
    await page.getByRole('tab', { name: /커밋 이력/ }).click();
    await expect(page).toHaveURL(/\/teams\/1\/commits$/);
    await expect(page.locator('.crow', { hasText: '테스트 업로드' })).toBeVisible();
  });

  test('파일 상세에서 커밋 보기로 이동한다', async ({ page }) => {
    await login(page);
    await page.goto('/teams/1/files');
    await page.locator('.frow', { hasText: 'ERD.png' }).click();
    await expect(page).toHaveURL(/\?file=6$/);
    await page.getByRole('link', { name: '커밋 보기' }).first().click();
    await expect(page).toHaveURL(/\/teams\/1\/commits\?commit=\d+$/);
    await expect(page.getByRole('complementary', { name: '커밋 상세' })).toBeVisible();
  });

  test('내가 올린 파일을 삭제한다', async ({ page }) => {
    await login(page);
    await page.goto('/teams/1/files?file=3');
    await page.getByRole('complementary', { name: '파일 상세' }).getByRole('button', { name: '삭제' }).click();
    await page.getByRole('dialog').getByRole('button', { name: '삭제', exact: true }).click();
    await expect(page.locator('#toast')).toContainText('기획서.pdf을(를) 삭제했어요.');
    await expect(page.locator('.frow', { hasText: '기획서.pdf' })).toHaveCount(0);
  });
});

test.describe('Task', () => {
  test('Task를 만들면 TODO에 붙는다', async ({ page }) => {
    await login(page);
    await page.goto('/teams/1/tasks');
    await page.getByRole('button', { name: 'Task 생성' }).click();
    await page.getByLabel('제목').fill('E2E 테스트 Task');
    await page.getByRole('button', { name: '등록', exact: true }).click();
    await expectToast(page, '"E2E 테스트 Task"을(를) TODO에 붙였어요.');
    await expect(page.locator('#col-todo').getByText('E2E 테스트 Task')).toBeVisible();
  });

  test('상세 패널에서 상태를 바꾼다', async ({ page }) => {
    await login(page);
    await page.goto('/teams/1/tasks');
    await page.getByRole('link', { name: '와이어프레임 작성 (TODO)' }).click();
    await expect(page).toHaveURL(/\?task=1$/);
    await page.getByRole('complementary', { name: 'Task 상세' }).getByRole('button', { name: 'DOING' }).click();
    await expectToast(page, 'DOING(으)로 옮겼어요.');
    await expect(page.locator('#col-doing').getByText('와이어프레임 작성')).toBeVisible();
  });

  test('승인된 PR이 연결된 DONE Task를 되돌릴 때는 확인한다', async ({ page }) => {
    await login(page);
    await page.goto('/teams/1/tasks?task=6');
    await page.getByRole('complementary', { name: 'Task 상세' }).getByRole('button', { name: 'TODO' }).click();
    await expect(page.getByRole('dialog', { name: '상태 변경 확인' })).toBeVisible();
    await page.getByRole('button', { name: '바꾸기' }).click();
    await expect(page.locator('#col-todo').getByText('기획서 작성')).toBeVisible();
  });
});

test.describe('PR·리뷰', () => {
  test('PR을 만들면 리뷰 대기 상세로 이동한다', async ({ page }) => {
    await login(page);
    await page.goto('/teams/1/pulls?status=waiting');
    await page.getByRole('button', { name: '새 PR' }).click();
    await page.getByLabel('제목').fill('E2E PR');
    await page.getByRole('checkbox', { name: /요구사항정의서 업로드/ }).click();
    await page.getByRole('checkbox', { name: /달팽이/ }).click();
    await page.getByLabel('연결할 Task').selectOption({ label: '[TODO] 요구사항 정의서 보완' });
    await page.getByRole('button', { name: 'PR 만들기' }).click();
    await expect(page).toHaveURL(/\/teams\/1\/pulls\/13\?status=waiting$/);
    await expect(page.getByLabel('PR #13 상세')).toBeVisible();
  });

  test('리뷰를 남기고 PR을 승인한다', async ({ page }) => {
    await login(page);
    await page.goto('/teams/1/pulls/10?status=waiting');
    await page.getByLabel('리뷰 입력').fill('좋아요');
    await page.getByRole('button', { name: '리뷰 등록' }).click();
    await expectToast(page, '리뷰를 남겼어요.');
    await expect(page.locator('#bubbles')).toContainText('좋아요');
    await page.getByRole('button', { name: '승인', exact: true }).click();
    await expectToast(page, 'PR을 승인했어요. 연결된 Task가 DONE이 됐어요.');
    await expect(page).toHaveURL(/status=approved/);
    await expect(page.locator('.stamp')).toContainText('승인됨');
  });

  test('PR을 거부하면 사유가 리뷰로 남는다', async ({ page }) => {
    await login(page);
    await page.goto('/teams/1/pulls/12?status=waiting');
    await page.getByRole('button', { name: '거부', exact: true }).click();
    await expect(page).toHaveURL(/modal=reject/);
    await page.getByLabel('거부 사유').fill('다시 확인해 주세요');
    await page.getByRole('dialog').getByRole('button', { name: '거부', exact: true }).click();
    await expect(page).toHaveURL(/status=closed/);
    await expect(page.locator('.stamp.end')).toContainText('거부됨');
  });
});
