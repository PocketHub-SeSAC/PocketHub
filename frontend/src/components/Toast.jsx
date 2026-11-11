import { createContext, useCallback, useContext, useRef, useState } from 'react';

const ToastCtx = createContext(() => {});

export function ToastProvider({ children }) {
  const [msg, setMsg] = useState('');
  const timer = useRef(null);
  const show = useCallback((text) => {
    setMsg(text);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(''), 2400);
  }, []);
  return (
    <ToastCtx.Provider value={show}>
      {children}
      <div className="toast" id="toast" role="status" aria-live="polite" hidden={!msg}>{msg}</div>
    </ToastCtx.Provider>
  );
}

/** const toast = useToast(); toast('저장했어요') */
export const useToast = () => useContext(ToastCtx);
