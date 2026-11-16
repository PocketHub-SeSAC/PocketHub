// 모든 화면의 뼈대: <html>·글꼴·테마 깜빡임 방지 스크립트·공통 CSS와 공통 틀(AppShell)을 둔다.
import { Suspense } from 'react';
import AppShell from '@/components/common/AppShell';
import { THEME_INIT_SCRIPT } from '@/utils/theme';
import '@/styles/themes.css';
import '@/styles/base.css';

export const metadata = {
  title: '포켓 헙 · PoketHub',
  icons: { icon: 'data:,' },
};

export default function RootLayout({ children }) {
  return (
    // 테마 스크립트가 그리기 전에 data-theme 을 바꾸므로 html 속성 차이 경고는 끈다
    <html lang='ko' suppressHydrationWarning>
      <head>
        <link rel='preconnect' href='https://cdn.jsdelivr.net' crossOrigin='' />
        {/* 본문 폰트(--font-body): Pretendard, 화면에 쓰인 글자 조각만 받는 dynamic subset */}
        <link rel='stylesheet' href='https://cdn.jsdelivr.net/npm/pretendard@1.3.9/dist/web/static/pretendard-dynamic-subset.min.css' />
        {/* 픽셀 폰트(--font-pixel): 로고·화면 제목·큰 버튼 */}
        <link rel='stylesheet' href='https://cdn.jsdelivr.net/npm/galmuri@2.40.3/dist/galmuri.css' />
        <link rel='preconnect' href='https://fonts.googleapis.com' />
        <link rel='preconnect' href='https://fonts.gstatic.com' crossOrigin='' />
        <link rel='stylesheet' href='https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap' />
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        {/* 공통 틀이 주소 쿼리(?panel=me, ?dev 등)를 읽으므로 Suspense 로 감싼다 */}
        <Suspense fallback={null}>
          <AppShell>{children}</AppShell>
        </Suspense>
      </body>
    </html>
  );
}
