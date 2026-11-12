'use client';
/* [담당 3] 파일 — /teams/[teamId]/files */

/* ?modal=upload  ?file=:fileId (오른쪽 상세 패널)  ?file=:fileId&modal=delete-file
   - 목록은 파일의 현재 버전만. 이전 버전은 커밋 상세에서 내려받는다
   - 삭제 버튼은 올린 본인(현재 버전 업로더)에게만. 삭제도 커밋 메시지를 받는다 */
import { useState } from 'react';
import Link from 'next/link';
import { getFiles, getFile, getCommits, downloadFile, deleteFile } from '@/services/files';
import { saveBlob } from '@/services/client';
import { useTeam } from '@/components/team/TeamShell';
import useAsync from '@/hooks/useAsync';
import useQuery from '@/hooks/useQuery';
import ListState from '@/components/common/ListState';
import { Modal } from '@/components/common/Modal';
import Field from '@/components/common/Field';
import Icon from '@/components/common/Icon';
import Who from '@/components/common/Who';
import { useToast } from '@/components/common/Toast';
import { formatDate, formatSize } from '@/utils/format';
import FilesToolbar from './FilesToolbar';
import UploadModal from './UploadModal';

function DeleteFileModal({ teamId, file, onClose, onDone }) {
  const toast = useToast();
  const [message, setMessage] = useState(`${file.name.replace(/\.[^.]+$/, '')} 삭제`);
  const [err, setErr] = useState('');
  const [serverErr, setServerErr] = useState('');
  const [busy, setBusy] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) { setErr('삭제 이유를 커밋 메시지로 입력해 주세요.'); return; }
    setBusy(true); setServerErr('');
    try {
      const c = await deleteFile(teamId, file.id, { message: message.trim() });
      toast(`${file.name}을(를) 삭제했어요. 커밋 ${c.hash}에 기록됐어요.`);
      onDone();
    } catch (er) { setServerErr(er.message); setBusy(false); }
  };
  return (
    <Modal title='파일 삭제' icon='trash' onClose={onClose} size='sm'>
      <form onSubmit={handleSubmit} noValidate>
        {serverErr && <div className='alert' role='alert'><Icon name='x' />{serverErr}</div>}
        <p><b>{file.name}</b>을(를) 삭제할까요?</p>
        <p className='sub-hint'>삭제도 커밋으로 기록돼요. 이전 버전은 커밋 이력에서 계속 내려받을 수 있어요.</p>
        <Field id='delete-message' label='커밋 메시지' required maxLength={100} value={message} error={err} onChange={(e) => { setMessage(e.target.value); setErr(''); }} />
        <div className='foot'>
          <button className='btn' type='button' onClick={onClose}>취소</button>
          <button className='btn btn-no' type='submit' disabled={busy}>{busy ? '삭제 중…' : '삭제'}</button>
        </div>
      </form>
    </Modal>
  );
}

function FileSide({ teamId, fileId, me, onClose, onDelete }) {
  const toast = useToast();
  const f = useAsync(() => getFile(teamId, fileId), [teamId, fileId]);
  const handleDownload = async () => {
    try { saveBlob(await downloadFile(teamId, fileId), f.data.name); toast('다운로드를 시작해요.'); }
    catch (err) { toast(err.message); }
  };
  const mine = f.data && f.data.uploader && f.data.uploader.id === me.id;
  return (
    <aside className='panel side' aria-label='파일 상세'>
      <div className='panel-head sidehead'><span>파일 상세</span><button className='xbtn' type='button' onClick={onClose} aria-label='파일 상세 닫기'><Icon name='x' /></button></div>
      <div className='pad'>
        <ListState loading={f.loading} error={f.error} onRetry={() => f.reload()}>
          {f.data && (
            <>
              <div className='who' style={{ fontSize: 16 }}><Icon name='file' />{f.data.name} {f.data.version > 1 && <span className='badge ver'>v{f.data.version}</span>}</div>
              <dl className='kv'>
                <dt>파일 크기</dt><dd>{formatSize(f.data.size)}</dd>
                <dt>버전</dt><dd>v{f.data.version}</dd>
                <dt>업로드 날짜</dt><dd>{formatDate(f.data.uploadedAt)}</dd>
                <dt>올린 사람</dt><dd><Who user={f.data.uploader} me={mine} /></dd>
              </dl>
              <div className='rowbtns'>
                <button className='btn' type='button' onClick={handleDownload}><Icon name='download' />다운로드</button>
                {mine && <button className='btn btn-no' type='button' onClick={onDelete}><Icon name='trash' />삭제</button>}
              </div>
              <p className='sub-hint'>{mine ? '내가 올린 파일이라 삭제할 수 있어요.' : '삭제는 파일을 올린 사람만 할 수 있어요.'}</p>
              {f.data.versions.length > 0 && (
                <div>
                  <div className='sec-label'>버전 기록</div>
                  <ul className='items'>
                    {f.data.versions.map((v) => (
                      <li key={v.version} className='item'>
                        <span className='badge ver'>v{v.version}</span>
                        <span className='grow'><Who user={v.uploader} /> <span className='size'>{formatDate(v.uploadedAt)} · {formatSize(v.size)}</span></span>
                        <Link className='btn btn-sm' href={`/teams/${teamId}/commits?commit=${v.commitId}`}>커밋 보기</Link>
                      </li>
                    ))}
                  </ul>
                  <p className='sub-hint' style={{ marginTop: 8 }}>이전 버전은 커밋 상세에서 내려받을 수 있어요.</p>
                </div>
              )}
            </>
          )}
        </ListState>
      </div>
    </aside>
  );
}

export default function FilesScreen() {
  const { teamId, me } = useTeam();
  const [q, setQuery] = useQuery();
  const files = useAsync(() => getFiles(teamId), [teamId]);
  const commits = useAsync(() => getCommits(teamId), [teamId]);
  const fileId = q.get('file');
  const modal = q.get('modal');
  const selected = (files.data || []).find((f) => String(f.id) === fileId);
  const refresh = () => { files.reload(true); commits.reload(true); };

  return (
    <>
      <FilesToolbar teamId={teamId} active='files' fileCount={files.data?.length} commitCount={commits.data?.length}
        onUpload={() => setQuery({ modal: 'upload' })} />
      <div className={`split ${fileId ? 'has-side' : ''}`}>
        <div className='panel'>
          <div className='fhead'><span /><span>파일명</span><span>크기</span><span>올린 사람</span><span>업로드 날짜</span></div>
          <ListState loading={files.loading} error={files.error} onRetry={() => files.reload()}
            empty={files.data && !files.data.length} emptyText='아직 업로드한 파일이 없어요. 첫 파일을 올려 보세요.'
            emptyAction={<button className='btn btn-sm' type='button' onClick={() => setQuery({ modal: 'upload' })}><Icon name='upload' />파일 업로드</button>}>
            {(files.data || []).map((f) => (
              <a key={f.id} className={`frow ${String(f.id) === fileId ? 'sel' : ''}`} href={`?file=${f.id}`}
                onClick={(e) => { e.preventDefault(); setQuery({ file: f.id, modal: null }); }}>
                <Icon name='file' />
                <span className='nm'><span>{f.name}</span>{f.version > 1 && <span className='badge ver'>v{f.version}</span>}</span>
                <span className='muted'>{formatSize(f.size)}</span>
                <Who user={f.uploader} />
                <span className='muted'>{formatDate(f.uploadedAt)}</span>
              </a>
            ))}
          </ListState>
        </div>
        {fileId && (
          <FileSide key={fileId} teamId={teamId} fileId={fileId} me={me}
            onClose={() => setQuery({ file: null, modal: null })} onDelete={() => setQuery({ modal: 'delete-file' })} />
        )}
      </div>

      {modal === 'upload' && (
        <UploadModal teamId={teamId} existing={files.data || []} onClose={() => setQuery({ modal: null })}
          onDone={() => { setQuery({ modal: null }); refresh(); }} />
      )}
      {modal === 'delete-file' && selected && selected.uploader?.id === me.id && (
        <DeleteFileModal teamId={teamId} file={selected} onClose={() => setQuery({ modal: null })}
          onDone={() => { setQuery({ modal: null, file: null }); refresh(); }} />
      )}
    </>
  );
}
