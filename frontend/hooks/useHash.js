/* 주소의 #해시(예: /me#review)를 읽는 훅. Next.js 라우터는 해시를 알려주지 않아서 직접 읽는다 */
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export default function useHash() {
  const pathname = usePathname();
  const [hash, setHash] = useState('');
  useEffect(() => {
    const handleHashChange = () => setHash(window.location.hash);
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [pathname]);
  return hash;
}
