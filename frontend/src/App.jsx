import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import RootLayout from './layouts/RootLayout';
import RequireAuth from './layouts/RequireAuth';
import TeamLayout from './layouts/TeamLayout';
import Page from './layouts/Page';
import { useToast } from './components/Toast';
import MainPage from './features/main/MainPage';
import AuthPage from './features/auth/AuthPage';
import TeamListPage from './features/teams/TeamListPage';
import TeamDetailPage from './features/teams/TeamDetailPage';
import FilesPage from './features/files/FilesPage';
import CommitsPage from './features/files/CommitsPage';
import TasksPage from './features/tasks/TasksPage';
import PullsPage from './features/pulls/PullsPage';
import MePage from './features/me/MePage';

/* 화면 목록 (프론트 라우팅)
   /                     메인            (예전 ?modal=create-team 은 /teams?modal=create-team 으로 보냄)
   /auth                 로그인/회원가입  ?tab=login|signup  (&next=돌아갈 주소)
   /teams                팀 목록         ?modal=create-team
   /teams/:teamId        팀 상세         ?modal=edit-team|delete-team  ?member=:userId
   /teams/:teamId/files  파일            ?modal=upload  ?file=:fileId(&modal=delete-file)
   /teams/:teamId/commits 커밋 이력      ?commit=:commitId
   /teams/:teamId/tasks  태스크 보드     ?modal=new-task  ?task=:taskId
   /teams/:teamId/pulls  PR             ?status=waiting|approved|closed  ?modal=new-pr
   /teams/:teamId/pulls/:prId  PR 상세
   /me                   마이페이지 (Could)  #review = 내가 리뷰할 PR
   모든 화면 공통: ?panel=me (내 정보), ?modal=profile-icon (아이콘 선택, Could), ?dev (목업 조작판) */
function NotFound() {
  const toast = useToast();
  useEffect(() => { toast('찾을 수 없습니다.'); }, [toast]);
  return <Navigate to="/" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route element={<RootLayout />}>
        <Route path="/" element={<Page><MainPage /></Page>} />
        <Route path="/auth" element={<Page><AuthPage /></Page>} />
        <Route element={<RequireAuth />}>
          <Route path="/teams" element={<Page><TeamListPage /></Page>} />
          <Route path="/me" element={<Page><MePage /></Page>} />
          <Route path="/teams/:teamId" element={<TeamLayout />}>
            <Route index element={<TeamDetailPage />} />
            <Route path="files" element={<FilesPage />} />
            <Route path="commits" element={<CommitsPage />} />
            <Route path="tasks" element={<TasksPage />} />
            <Route path="pulls" element={<PullsPage />} />
            <Route path="pulls/:prId" element={<PullsPage />} />
          </Route>
        </Route>
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
