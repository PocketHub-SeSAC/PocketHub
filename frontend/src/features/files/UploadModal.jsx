/* [담당 3] 파일 업로드 모달 (?modal=upload)
   확정 규칙: 파일 1개 = 커밋 1개. 커밋 메시지 필수. 같은 이름이면 "새 버전"으로 표시.
   끌어다 놓기 또는 눌러서 고르기 — 여러 개를 넣으면 안내만 하고 받지 않는다.
   확장자·크기 검사는 config/upload.js 규칙을 따른다. */
import { useEffect, useRef, useState } from 'react';
import { uploadFile } from '../../api/files';
import { UPLOAD_RULES, ONE_FILE_ONLY, validateFile } from '../../config/upload';
import { Modal } from '../../components/Modal';
import Field from '../../components/Field';
import Icon from '../../components/Icon';
import { useToast } from '../../components/Toast';
import { formatSize } from '../../utils/format';

const baseName = (n) => n.replace(/\.[^.]+$/, '');

export default function UploadModal({ teamId, existing, onClose, onDone }) {
  const toast = useToast();
  const picker = useRef(null);
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [touchedMsg, setTouchedMsg] = useState(false);
  const [over, setOver] = useState(false);
  const [errs, setErrs] = useState({ file: '', message: '' });
  const [serverErr, setServerErr] = useState('');
  const [busy, setBusy] = useState(false);
  const isNewVersion = file && existing.some((f) => f.name === file.name);

  // 모달 밖에 떨어뜨려도 브라우저가 파일을 열지 않게
  useEffect(() => {
    const stop = (e) => { if (e.dataTransfer && [...e.dataTransfer.types].includes('Files')) e.preventDefault(); };
    window.addEventListener('dragover', stop); window.addEventListener('drop', stop);
    return () => { window.removeEventListener('dragover', stop); window.removeEventListener('drop', stop); };
  }, []);

  const take = (list) => {
    const arr = [...(list || [])];
    if (!arr.length) return;
    if (arr.length > 1) { setErrs((e) => ({ ...e, file: ONE_FILE_ONLY })); return; }
    const f = arr[0];
    setFile(f);
    setErrs((e) => ({ ...e, file: validateFile(f) || '' }));
    // 직접 쓴 메시지가 없거나 비어 있으면 파일 이름으로 채워 준다
    if (!touchedMsg || !message.trim()) setMessage(`${baseName(f.name)} 업로드`);
  };

  const submit = async (e) => {
    e.preventDefault();
    const fe = { file: validateFile(file) || '', message: message.trim() ? '' : '커밋 메시지를 입력해 주세요.' };
    setErrs(fe); setServerErr('');
    if (fe.file || fe.message) return;
    setBusy(true);
    try {
      const commit = await uploadFile(teamId, { file, message: message.trim() });
      toast(`${file.name}을(를) 올렸어요. 커밋 ${commit.hash}이 만들어졌어요.`);
      onDone();
    } catch (err) { setServerErr(err.message); setBusy(false); }
  };

  const allowed = UPLOAD_RULES.ALLOWED_EXTENSIONS ? UPLOAD_RULES.ALLOWED_EXTENSIONS.join(', ') : '모든 형식';
  return (
    <Modal title="파일 업로드" icon="upload" onClose={onClose}>
      <form onSubmit={submit} noValidate>
        {serverErr && <div className="alert" role="alert"><Icon name="x" />{serverErr}</div>}
        <div className={`drop ${over ? 'over' : ''}`} role="button" tabIndex={0} aria-label="파일 1개를 끌어다 놓거나 눌러서 고르기"
          onClick={() => picker.current.click()}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); picker.current.click(); } }}
          onDragEnter={(e) => { e.preventDefault(); setOver(true); }}
          onDragOver={(e) => { e.preventDefault(); setOver(true); }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => { e.preventDefault(); setOver(false); take(e.dataTransfer.files); }}>
          <Icon name="upload" size={30} />
          <b>파일 1개를 끌어다 놓거나 눌러서 고르세요</b>
          <span className="sub-hint">가능한 형식: {allowed} · {UPLOAD_RULES.MAX_FILE_SIZE_MB}MB 이하 · 파일 1개 = 커밋 1개</span>
        </div>
        <input ref={picker} type="file" hidden onChange={(e) => { take(e.target.files); e.target.value = ''; }} />

        {file && (
          <div className="chips" aria-label="고른 파일">
            <span className={`chipfile ${validateFile(file) ? 'bad' : ''}`}>
              <Icon name="file" />{file.name} <span className="muted">{formatSize(file.size)}</span>
              {isNewVersion && <span className="badge ver">새 버전</span>}
              <button className="xbtn" type="button" aria-label={`${file.name} 빼기`} onClick={() => { setFile(null); setErrs((x) => ({ ...x, file: '' })); }}><Icon name="x" /></button>
            </span>
          </div>
        )}
        {errs.file && <div className="alert" role="alert"><Icon name="x" />{errs.file}</div>}

        <Field id="upload-message" label="커밋 메시지" required maxLength={100} placeholder="예: ERD 초안 업로드" value={message} error={errs.message}
          onChange={(e) => { setMessage(e.target.value); setTouchedMsg(true); }} />
        <div className="foot">
          <span className="hint muted">{isNewVersion ? '같은 이름의 파일이 있어 새 버전으로 올라가요.' : '업로드하면 커밋 1개가 만들어져요.'}</span>
          <button className="btn" type="button" onClick={onClose}>취소</button>
          <button className="btn btn-ink" type="submit" disabled={busy}>{busy ? '올리는 중…' : '업로드'}</button>
        </div>
      </form>
    </Modal>
  );
}
