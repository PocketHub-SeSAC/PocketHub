'use client';
/* 그리자마자 다른 주소로 바꿔치기한다 (기록을 남기지 않음) */
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Redirect({ to }) {
  const router = useRouter();
  useEffect(() => { router.replace(to); }, [router, to]);
  return null;
}
