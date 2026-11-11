import { useEffect, useRef } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { setApiHandlers } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { useToast } from '../components/Toast';
import AppBar from '../components/AppBar';
import DevBar from '../components/DevBar';
import MeDrawer from '../components/MeDrawer';
import ProfileIconModal from '../components/ProfileIconModal';
import { PrNotiProvider } from '../features/pulls/prNoti';

/* 모든 화면 공통 틀 + API 공통 오류 처리(401·404) 연결 */
export default function RootLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { forget } = useAuth();
  const loc = useRef(location);
  loc.current = location;

  useEffect(() => {
    setApiHandlers({
      unauthorized: () => {
        forget();
        toast('로그인이 만료됐어요. 다시 로그인해 주세요.');
        const next = encodeURIComponent(loc.current.pathname + loc.current.search);
        navigate(`/auth?tab=login&next=${next}`, { replace: true });
      },
      notFound: () => {
        toast('찾을 수 없습니다.');
        navigate('/', { replace: true });
      },
    });
  }, [navigate, toast, forget]);

  return (
    <PrNotiProvider>
      <DevBar />
      <AppBar />
      <Outlet />
      <MeDrawer />
      <ProfileIconModal />
    </PrNotiProvider>
  );
}
