// Playwright E2E 설정: 목업 모드 서버와 실서버 모드 서버(API 요청을 가로채 확인)를 띄워 테스트한다.
import { defineConfig, devices } from '@playwright/test';

const PORT = 5173;
const REAL_PORT = 5174;

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: {
    // 글꼴 안티앨리어싱 정도의 차이만 허용한다
    toHaveScreenshot: { maxDiffPixelRatio: 0.01, animations: 'disabled', caret: 'hide', stylePath: './e2e/screenshot.css' },
  },
  snapshotPathTemplate: '{testDir}/screenshots/{arg}{ext}',
  fullyParallel: true,
  workers: 4,
  reporter: [['list']],
  use: {
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
    viewport: { width: 1280, height: 900 },
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'mock',
      testIgnore: /api-real\.spec\.js/,
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 900 }, baseURL: `http://localhost:${PORT}` },
    },
    {
      name: 'real-api',
      testMatch: /api-real\.spec\.js/,
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 900 }, baseURL: `http://localhost:${REAL_PORT}` },
    },
  ],
  webServer: [
    {
      command: `npx vite --port ${PORT} --strictPort`,
      url: `http://localhost:${PORT}`,
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: `npx vite --port ${REAL_PORT} --strictPort`,
      url: `http://localhost:${REAL_PORT}`,
      reuseExistingServer: false,
      timeout: 120_000,
      env: { VITE_USE_MOCK: 'false', VITE_API_BASE_URL: 'http://api.test' },
    },
  ],
});
