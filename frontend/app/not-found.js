'use client';
// 없는 주소: "찾을 수 없습니다." 알림 후 메인으로 보낸다.
import { useEffect } from 'react';
import { useToast } from '@/components/common/Toast';
import Redirect from '@/components/common/Redirect';

export default function NotFound() {
  const toast = useToast();
  useEffect(() => { toast('찾을 수 없습니다.'); }, [toast]);
  return <Redirect to='/' />;
}
