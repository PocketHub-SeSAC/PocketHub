// 동작 테스트: 로그인·팀·파일·Task·PR 흐름과 추가 기능(프로필 아이콘, 마이페이지, PR 알림 배지, 테마)을 확인한다.
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
