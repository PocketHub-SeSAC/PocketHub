// 화면 테스트: 주소마다 화면과 모달·패널(URL 쿼리)을 열어 기준 스크린샷과 비교한다.
import { test, expect, login, snap } from './helpers';

// [이름, 주소, 로그인 필요, 다 그려졌는지 확인할 글자]
const GUEST_SCREENS = [
  ['01-main-guest', '/', '시작하기'],
  ['02-auth-login', '/auth?tab=login', '데모 계정'],
  ['03-auth-signup', '/auth?tab=signup', '가입이 끝나면'],
];

const USER_SCREENS = [
  ['10-main-user', '/', '내 팀으로 가기'],
  ['11-teams', '/teams', '포켓 개발팀'],
  ['12-teams-create', '/teams?modal=create-team', '만든 사람은 자동으로'],
  ['13-team-owner', '/teams/1', '팀원 4명'],
  ['14-team-member', '/teams/2', '팀 생성자만 할 수 있어요'],
  ['15-team-member-modal', '/teams/1?member=2', 'snail@example.com'],
  ['16-team-edit', '/teams/1?modal=edit-team', '팀 정보 수정'],
  ['17-team-delete', '/teams/1?modal=delete-team', '되돌릴 수 없어요'],
  ['20-files', '/teams/1/files', 'ERD.png'],
  ['21-files-side', '/teams/1/files?file=7', '버전 기록'],
  ['22-files-upload', '/teams/1/files?modal=upload', '파일 1개를 끌어다 놓거나'],
  ['23-files-delete', '/teams/1/files?file=3&modal=delete-file', '삭제도 커밋으로 기록돼요'],
  ['24-commits', '/teams/1/commits', 'ERD 컬럼 보완'],
  ['25-commits-side', '/teams/1/commits?commit=8', '포함된 파일'],
  ['30-tasks', '/teams/1/tasks', '와이어프레임 작성'],
  ['31-tasks-new', '/teams/1/tasks?modal=new-task', '새 Task는 TODO에 추가돼요'],
  ['32-tasks-side', '/teams/1/tasks?task=4', '연결된 PR'],
  ['33-tasks-delete', '/teams/1/tasks?task=4&modal=delete-task', 'Task 연결은 사라져요'],
  ['40-pulls-waiting', '/teams/1/pulls?status=waiting', 'ERD 초안 검토 요청'],
  ['41-pulls-detail', '/teams/1/pulls/12?status=waiting', '회의에서 정하고 ERD에 반영할게요.'],
  ['42-pulls-approved', '/teams/1/pulls/9?status=approved', '승인됨'],
  ['43-pulls-closed', '/teams/1/pulls/8?status=closed', '거부됨'],
  ['44-pulls-new', '/teams/1/pulls?status=waiting&modal=new-pr', '포함할 커밋'],
  ['45-pulls-reject', '/teams/1/pulls/10?status=waiting&modal=reject', '거부 사유'],
  ['50-me', '/me', '최근 내 커밋'],
  ['51-me-drawer', '/teams?panel=me', '마이페이지'],
  ['52-profile-icon', '/teams?modal=profile-icon', '고른 아이콘은'],
  ['53-devbar', '/teams?dev', 'MOCKUP'],
];

test.describe('비로그인 화면', () => {
  for (const [name, path, ready] of GUEST_SCREENS) {
    test(name, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByText(ready).first()).toBeVisible();
      await snap(page, name);
    });
  }

  test('04-auth-login-error', async ({ page }) => {
    await page.goto('/auth?tab=login');
    await page.getByLabel('이메일').fill('');
    await page.getByLabel('비밀번호').fill('');
    await page.getByRole('button', { name: '로그인', exact: true }).click();
    await expect(page.locator('.field-err').first()).toBeVisible();
    await snap(page, '04-auth-login-error');
  });
});

test.describe('로그인 화면', () => {
  for (const [name, path, ready] of USER_SCREENS) {
    test(name, async ({ page }) => {
      await login(page);
      await page.goto(path);
      await expect(page.getByText(ready).first()).toBeVisible();
      await snap(page, name);
    });
  }
});

test.describe('테마', () => {
  for (const theme of ['dark', 'pink']) {
    test(`60-theme-${theme}`, async ({ page }) => {
      await page.goto('/');
      await page.getByRole('button', { name: theme === 'dark' ? '다크 테마' : '핑크 테마' }).click();
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      await snap(page, `60-theme-${theme}`);
    });
  }
});
