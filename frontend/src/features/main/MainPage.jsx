/* 메인 — /
   - 비로그인: 서비스 소개. 시작하기·기능 카드 → 로그인 화면
   - 로그인: 같은 소개 + "내 팀으로 가기". 기능 카드 → 내 팀
   - 팀 만들기는 팀 목록(/teams) 오른쪽 위 버튼으로 옮겼다. 예전 주소 /?modal=create-team 은 그쪽으로 보낸다
   - 맨 아래: 테마 선택(색 네모 3개)
   내 정보 확인·로그아웃은 상단 바(닉네임 → 내 정보 패널)에서 한다. */
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../components/Toast';
import useQuery from '../../hooks/useQuery';
import Icon from '../../components/Icon';
import ThemePicker from './ThemePicker';
import { SCENE_HTML } from './sceneMarkup';

const FEATURES = [
  { icon: 'featureFiles', size: 35, title: '파일 관리', text: '팀 파일을 올리고 내려받아요. 올리거나 지울 때마다 Commit으로 기록이 남아요.' },
  { icon: 'task', size: 48, title: '태스크 관리', text: '할 일을 포스트잇으로 붙이고, 담당자와 마감일, 우선순위를 정해요.' },
  { icon: 'review', size: 45, title: 'PR 리뷰', text: 'Commit과 Task를 묶어 PR로 올리고, 리뷰를 주고받은 뒤 승인해요.' },
];

export default function MainPage() {
  const { user } = useAuth();
  const [q] = useQuery();
  const navigate = useNavigate();
  const toast = useToast();

  // 예전 주소 호환: /?modal=create-team → 팀 목록의 팀 만들기 (비로그인이면 RequireAuth 가 로그인으로 보냄)
  if (q.get('modal') === 'create-team') return <Navigate to="/teams?modal=create-team" replace />;

  const goFeature = () => {
    if (user) navigate('/teams');
    else { toast('로그인하면 이용할 수 있어요.'); navigate('/auth?tab=login'); }
  };

  return (
    <>
      <div className="hero">
        <div>
          <h1 className="svc" aria-label="포켓 헙" />
          <p className="tagline">팀의 파일과 할 일, 한 주머니에</p>
          <p className="sub muted">파일은 Commit으로 기록하고, Task는 포스트잇으로 붙이고, PR로 서로 확인해요.</p>
        </div>
        <div className="cta">
          {user ? (
            <Link className="btn btn-ink btn-lg" to="/teams">내 팀으로 가기</Link>
          ) : (
            <Link className="btn btn-ink btn-lg" to="/auth?tab=login">시작하기</Link>
          )}
          <span className="blink" aria-hidden="true">PRESS START</span>
        </div>
      </div>

      <div className="scene" aria-hidden="true" dangerouslySetInnerHTML={{ __html: SCENE_HTML }} />

      <div className="features">
        {FEATURES.map((f) => (
          <div key={f.title} className="feature" role="link" tabIndex={0} aria-label={`${f.title}: ${user ? '내 팀으로 이동' : '로그인하고 이용하기'}`}
            onClick={goFeature} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goFeature(); } }}>
            <div className="ico"><Icon name={f.icon} size={f.size} /></div>
            <h3>{f.title}</h3>
            <p>{f.text}</p>
          </div>
        ))}
      </div>

      <ThemePicker />

    </>
  );
}
