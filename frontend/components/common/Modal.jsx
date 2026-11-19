'use client';
/* 화면 가운데 모달 / 오른쪽 서랍. 바깥 클릭·Esc·닫기 버튼으로 onClose */
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Icon from './Icon';

function useOverlay(onClose, boxRef) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const handleKeyDown = (e) => { if (e.key === 'Escape') closeRef.current(); };
    document.addEventListener('keydown', handleKeyDown);
    // 처음 열릴 때 한 번만 첫 입력칸에 포커스
    const box = boxRef.current;
    const first = box && (box.querySelector('[data-autofocus]') || box.querySelector('input, textarea, select, button:not(.xbtn)'));
    if (first) first.focus();
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [boxRef]);
}

export function Modal({ title, icon, onClose, size = '', children, label }) {
  const box = useRef(null);
  useOverlay(onClose, box);
  return createPortal(
    <div className='overlay' role='dialog' aria-modal='true' aria-label={label || title}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={`modal ${size}`} ref={box}>
        <header>
          <h3>{icon && <Icon name={icon} />}{title}</h3>
          <button className='xbtn' type='button' onClick={onClose} aria-label='닫기'><Icon name='x' /></button>
        </header>
        {children}
      </div>
    </div>,
    document.body,
  );
}

export function Drawer({ title, onClose, children }) {
  const box = useRef(null);
  useOverlay(onClose, box);
  return createPortal(
    <div className='overlay right' role='dialog' aria-modal='true' aria-label={title}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className='drawer' ref={box}>
        <header>
          <h3>{title}</h3>
          <button className='xbtn' type='button' onClick={onClose} aria-label='닫기'><Icon name='x' /></button>
        </header>
        {children}
      </div>
    </div>,
    document.body,
  );
}
