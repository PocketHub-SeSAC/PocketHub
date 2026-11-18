'use client';
/* [담당 3] 커밋 이력 — /teams/[teamId]/commits  ?commit=:commitId (오른쪽 상세 패널) */

/* 커밋 상세는 API-019(커밋 정보)와 API-020(포함 파일)을 따로 불러서 그린다.
   포함 파일은 그 커밋 당시 버전으로 내려받을 수 있다(API-021) → 이전 버전 다운로드. */
import Link from 'next/link';
import { getCommitsPage, getCommit, getCommitFiles, getFiles, downloadFile, downloadCommitFile } from '@/services/files';
import { saveBlob } from '@/services/client';
import { useTeam } from '@/components/team/TeamShell';
import useAsync from '@/hooks/useAsync';
import useQuery from '@/hooks/useQuery';
import ListState from '@/components/common/ListState';
import Icon from '@/components/common/Icon';
import Who from '@/components/common/Who';
import { useToast } from '@/components/common/Toast';
import { formatDate, formatDateTime, formatSize } from '@/utils/format';
import FilesToolbar from '@/components/file/FilesToolbar';
import UploadModal from '@/components/file/UploadModal';

const ACTION = { ADD: ['추가', 'badge ok'], UPDATE: ['수정', 'badge'], DELETE: ['삭제', 'badge end'] };

function CommitSide({ teamId, commitId, me, onClose }) {
  const toast = useToast();
  const info = useAsync(() => getCommit(teamId, commitId), [teamId, commitId]);       // API-019
  const files = info.data?.files;
  const handleDownload = async () => {
    try { saveBlob(await downloadCommitFile(teamId, commitId), commitId+".zip"); toast(`커밋 ID v${commitId}을(를) 내려받아요.`); }
    catch (err) { toast(err.message); }
  };
  const handleDownloadFile = async (f) => {
    try { saveBlob(await downloadFile(teamId, f.fileId), f.fileName); toast(`${f.fileName} 다운로드를 시작해요.`); }
    catch (err) { toast(err.message); }
  };
  const c = info.data;
  return (
    <aside className='panel side' aria-label='커밋 상세'>
      <div className='panel-head sidehead'><span>커밋 상세</span><button className='xbtn' type='button' onClick={onClose} aria-label='커밋 상세 닫기'><Icon name='x' /></button></div>
      <div className='pad'>
        <ListState loading={info.loading} error={info.error} onRetry={() => info.reload()}>
          {c && (
            <>
              <div className='who' style={{ fontSize: 16, whiteSpace: 'normal' }}><Icon name='commit' />{c.message}</div>
              <dl className='kv'>
                <dt>작성자</dt><dd><Who user={c.author} me={c.author?.id === me.id} /></dd>
                <dt>생성일</dt><dd>{formatDateTime(c.createdAt)}</dd>
                <dt>ID</dt><dd><span className='id'>{c.hash}</span></dd>
                <dt>PR</dt><dd>{c.prId ? <Link className='chip' href={`/teams/${teamId}/pulls/${c.prId}`}><Icon name='pr' />PR #{c.prId}</Link> : <span className='muted'>아직 PR에 연결되지 않았어요</span>}</dd>
              </dl>
            </>
          )}
        </ListState>
        <div>
          <div className='sec-label'>포함된 파일 {(files && files.length > 0 && files[0].state !== 'DELETE') && <button className='btn btn-sm' type='button' aria-label={`전체 다운로드`} onClick={() => handleDownload()}><Icon name='download' />다운로드</button>}</div>
          {(!files || files.length == 0) && '포함된 파일이 없어요.'}
            <ul className='items'>
              {(files || []).map((f) => (
                <li key={f.fileId} className='item'>
                  <span className={ACTION[f.action][1]} style={{ flex: 'none' }}>{ACTION[f.action][0]}</span>
                  <Icon name='file' />
                  <span className='grow'>{f.fileName} <span className='size'>{formatSize(f.size)}</span></span>
                  <span className={ACTION[f.state]?.[1]}>{ACTION[f.state]?.[0] || f.state}</span>
                  {f.state !== 'DELETE' && (
                    <button className='btn btn-sm' type='button' aria-label={`다운로드`} onClick={() => handleDownloadFile(f)}><Icon name='download' />다운로드</button>
                  )}
                </li>
              ))}
            </ul>
        </div>
      </div>
    </aside>
  );
}

export default function CommitsScreen() {
  const { teamId, me } = useTeam();
  const [q, setQuery] = useQuery();
  // 현재 페이지는 ?page= (0부터, 없으면 0)
  const page = Math.max(0, Number.parseInt(q.get('page') || '0', 10) || 0);
  const commits = useAsync(() => getCommitsPage(teamId, { page }), [teamId, page]);
  const files = useAsync(() => getFiles(teamId), [teamId]);
  const commitId = q.get('commit');
  const items = commits.data?.items;
  const totalPages = commits.data?.totalPages || 0;
  const goPage = (n) => setQuery({ page: n > 0 ? n : null });

  return (
    <>
      <FilesToolbar teamId={teamId} active='commits' fileCount={files.data?.length} commitCount={commits.data?.totalElements}
        onUpload={() => setQuery({ modal: 'upload' })} />
      <div className={`split ${commitId ? 'has-side' : ''}`}>
        <div className='panel'>
          <div className='crow fhead' style={{ borderTop: 0 }}><span>ID</span><span>커밋 메시지</span><span>작성자</span><span>생성일</span></div>
          <ListState loading={commits.loading} error={commits.error} onRetry={() => commits.reload()}
            empty={items && !items.length} emptyText={page > 0 ? '이 페이지에는 커밋이 없어요.' : '아직 커밋이 없어요. 파일을 올리면 커밋이 만들어져요.'}>
            {(items || []).map((c) => (
              <a key={c.id} className={`crow ${String(c.id) === commitId ? 'sel' : ''}`} href={`?commit=${c.id}`}
                onClick={(e) => { e.preventDefault(); setQuery({ commit: c.id }); }}>
                <span className='id'>{c.hash}</span>
                <span>{c.message}</span>
                <Who user={c.author} />
                <span className='muted'>{formatDate(c.createdAt)}</span>
              </a>
            ))}
          </ListState>
          {totalPages > 1 && (
            <nav className='rowbtns' aria-label='커밋 페이지' style={{ justifyContent: 'center', padding: '12px 14px', borderTop: '2px solid var(--tint)' }}>
              <button className='btn btn-sm' type='button' disabled={page <= 0} onClick={() => goPage(page - 1)}>이전</button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button key={i} className={`btn btn-sm ${i === page ? 'btn-ink' : ''}`} type='button'
                  aria-current={i === page ? 'page' : undefined} aria-label={`${i + 1}페이지`} onClick={() => goPage(i)}>{i + 1}</button>
              ))}
              <button className='btn btn-sm' type='button' disabled={page >= totalPages - 1} onClick={() => goPage(page + 1)}>다음</button>
            </nav>
          )}
        </div>
        {commitId && <CommitSide key={commitId} teamId={teamId} commitId={commitId} me={me} onClose={() => setQuery({ commit: null })} />}
      </div>
      {q.get('modal') === 'upload' && (
        <UploadModal teamId={teamId} existing={files.data || []} onClose={() => setQuery({ modal: null })}
          onDone={() => { setQuery({ modal: null, page: null }); commits.reload(true); files.reload(true); }} />
      )}
    </>
  );
}
