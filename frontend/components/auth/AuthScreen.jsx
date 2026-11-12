'use client';
/* [담당 1] 로그인/회원가입 — /auth?tab=login | /auth?tab=signup (&next=돌아갈 주소) */

/* - 이미 로그인한 상태로 오면 /teams (또는 next) 로 보낸다
   - 로그인 성공 → next(원래 보던 화면) 또는 /teams
   - 회원가입 성공 → 로그인 탭으로 바뀌고 이메일이 채워진다 */
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Redirect from '@/components/common/Redirect';
import { useAuth } from './AuthProvider';
import { useToast } from '@/components/common/Toast';
import { USE_MOCK } from '@/services/client';
import useQuery from '@/hooks/useQuery';
import Field from '@/components/common/Field';
import Icon from '@/components/common/Icon';
import { checkEmail, checkPassword, checkNickname, safeNext } from '@/utils/validate';

const DEMO = { email: 'saessak@example.com', password: 'password123' }; // 목업 데모 계정

function LoginForm({ next, initialEmail }) {
  const { login } = useAuth();
  const router = useRouter();
  const toast = useToast();
  // 목업 모드에서만 데모 계정을 미리 채운다 (실서버 모드는 빈 칸). 회원가입 직후에는 가입한 이메일만 채운다
  const [v, setV] = useState(() => (initialEmail
    ? { email: initialEmail, password: '' }
    : { email: USE_MOCK ? DEMO.email : '', password: USE_MOCK ? DEMO.password : '' }));
  const [errs, setErrs] = useState({});
  const [serverErr, setServerErr] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fe = { email: checkEmail(v.email), password: checkPassword(v.password) };
    setErrs(fe); setServerErr('');
    if (fe.email || fe.password) return;
    setBusy(true);
    try {
      const me = await login(v.email.trim(), v.password);
      toast(`${me.nickname}님, 반가워요!`);
      router.replace(next);
    } catch (err) {
      setServerErr(err.message);
    } finally { setBusy(false); }
  };

  return (
    <form className='form' onSubmit={handleSubmit} noValidate>
      {serverErr && <div className='alert' role='alert'><Icon name='x' />{serverErr}</div>}
      <Field id='login-email' label='이메일' type='email' autoComplete='email' value={v.email} error={errs.email}
        onChange={(e) => setV({ ...v, email: e.target.value })} />
      <Field id='login-password' label='비밀번호' type='password' autoComplete='current-password' value={v.password} error={errs.password}
        onChange={(e) => setV({ ...v, password: e.target.value })} />
      <button className='btn btn-ink' type='submit' disabled={busy}>{busy ? '로그인 중…' : '로그인'}</button>
      {USE_MOCK && <p className='sub-hint'>데모 계정: saessak@example.com / password123 (다른 사용자: snail·acorn·cloud@example.com, 비밀번호 같음)</p>}
    </form>
  );
}

function SignupForm({ onDone }) {
  const { signup } = useAuth();
  const [v, setV] = useState({ email: '', password: '', nickname: '' });
  const [errs, setErrs] = useState({});
  const [serverErr, setServerErr] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fe = { email: checkEmail(v.email), password: checkPassword(v.password, { forSignup: true }), nickname: checkNickname(v.nickname) };
    setErrs(fe); setServerErr('');
    if (fe.email || fe.password || fe.nickname) return;
    setBusy(true);
    try {
      await signup({ email: v.email.trim(), password: v.password, nickname: v.nickname.trim() });
      onDone(v.email.trim());
    } catch (err) {
      setServerErr(err.message);
    } finally { setBusy(false); }
  };

  return (
    <form className='form' onSubmit={handleSubmit} noValidate>
      {serverErr && <div className='alert' role='alert'><Icon name='x' />{serverErr}</div>}
      <Field id='signup-email' label='이메일' required type='email' autoComplete='email' placeholder='you@example.com' value={v.email} error={errs.email}
        onChange={(e) => setV({ ...v, email: e.target.value })} />
      <Field id='signup-password' label='비밀번호' required type='password' autoComplete='new-password' placeholder='8자 이상' value={v.password} error={errs.password}
        onChange={(e) => setV({ ...v, password: e.target.value })} />
      <Field id='signup-nickname' label='닉네임' required placeholder='팀에서 보일 이름 (2~10자)' value={v.nickname} error={errs.nickname}
        onChange={(e) => setV({ ...v, nickname: e.target.value })} />
      <button className='btn btn-ink' type='submit' disabled={busy}>{busy ? '가입 중…' : '회원가입'}</button>
      <p className='sub-hint'>가입이 끝나면 로그인 탭으로 바뀌어요.</p>
    </form>
  );
}

export default function AuthScreen() {
  const { ready, user } = useAuth();
  const [q, setQuery] = useQuery();
  const toast = useToast();
  const [signedEmail, setSignedEmail] = useState('');
  const tab = q.get('tab') === 'signup' ? 'signup' : 'login';
  const next = safeNext(q.get('next'));
  const keep = q.get('next') ? `&next=${encodeURIComponent(q.get('next'))}` : '';

  const handleSignedUp = (email) => {
    setSignedEmail(email);
    toast('가입했어요. 로그인해 주세요.');
    setQuery({ tab: 'login' }, { replace: true });
  };

  if (ready && user) return <Redirect to={next} />;

  return (
    <div className='panel authbox'>
      <div className='panel-head'><span>계정</span></div>
      <div className='pad'>
        <div className='tabs' role='tablist'>
          <Link className='tab' role='tab' href={`/auth?tab=login${keep}`} replace scroll={false} aria-selected={tab === 'login'}>로그인</Link>
          <Link className='tab' role='tab' href={`/auth?tab=signup${keep}`} replace scroll={false} aria-selected={tab === 'signup'}>회원가입</Link>
        </div>
        {tab === 'login'
          ? <LoginForm key={signedEmail} next={next} initialEmail={signedEmail} />
          : <SignupForm onDone={handleSignedUp} />}
      </div>
    </div>
  );
}
