/* [담당 3] 커밋 이력 — /teams/:teamId/commits  ?commit=:commitId (오른쪽 상세 패널)
   커밋 상세는 API-019(커밋 정보)와 API-020(포함 파일)을 따로 불러서 그린다.
   포함 파일은 그 커밋 당시 버전으로 내려받을 수 있다(API-021) → 이전 버전 다운로드. */
import { Link } from 'react-router-dom';
import { getCommits, getCommit, getCommitFiles, getFiles, downloadCommitFile } from '../../api/files';
import { saveBlob } from '../../api/client';
import { useTeam } from '../../layouts/TeamLayout';
import useAsync from '../../hooks/useAsync';
import useQuery from '../../hooks/useQuery';
import ListState from '../../components/ListState';
import Icon from '../../components/Icon';
import Who from '../../components/Who';
import { useToast } from '../../components/Toast';
import { formatDate, formatDateTime, formatSize } from '../../utils/format';
import FilesToolbar from './FilesToolbar';
import UploadModal from './UploadModal';

const TYPE = { UPLOAD: ['업로드', 'badge'], DELETE: ['삭제', 'badge end'] };
const ACTION = { ADD: ['추가', 'badge ok'], MODIFY: ['수정', 'badge'], DELETE: ['삭제', 'badge end'] };

function CommitSide({ teamId, commitId, me, onClose }) {
  const toast = useToast();
  const info = useAsync(() => getCommit(teamId, commitId), [teamId, commitId]);       // API-019
  const files = useAsync(() => getCommitFiles(teamId, commitId), [teamId, commitId]); // API-020
  const download = async (f) => {
    try { saveBlob(await downloadCommitFile(teamId, commitId, f.fileId), f.name); toast(`${f.name} v${f.version}을(를) 내려받아요.`); }
    catch (err) { toast(err.message); }
  };
  const c = info.data;
  return (
    <aside className="panel side" aria-label="커밋 상세">
      <div className="panel-head sidehead"><span>커밋 상세</span><button className="xbtn" type="button" onClick={onClose} aria-label="커밋 상세 닫기"><Icon name="x" /></button></div>
      <div className="pad">
        <ListState loading={info.loading} error={info.error} onRetry={() => info.reload()}>
          {c && (
            <>
              <div className="who" style={{ fontSize: 16, whiteSpace: 'normal' }}><Icon name="commit" />{c.message}</div>
              <dl className="kv">
                <dt>종류</dt><dd><span className={TYPE[c.type][1]}>{TYPE[c.type][0]}</span></dd>
                <dt>작성자</dt><dd><Who user={c.author} me={c.author?.id === me.id} /></dd>
                <dt>생성일</dt><dd>{formatDateTime(c.createdAt)}</dd>
                <dt>ID</dt><dd><span className="id">{c.hash}</span></dd>
                <dt>PR</dt><dd>{c.prId ? <Link className="chip" to={`/teams/${teamId}/pulls/${c.prId}`}><Icon name="pr" />PR #{c.prId}</Link> : <span className="muted">아직 PR에 연결되지 않았어요</span>}</dd>
              </dl>
            </>
          )}
        </ListState>
        <div>
          <div className="sec-label">포함된 파일</div>
          <ListState loading={files.loading} error={files.error} onRetry={() => files.reload()}
            empty={files.data && !files.data.length} emptyText="포함된 파일이 없어요.">
            <ul className="items">
              {(files.data || []).map((f) => (
                <li key={f.fileId} className="item">
                  <Icon name="file" />
                  <span className="grow">{f.name} <span className="badge ver">v{f.version}</span> <span className="size">{formatSize(f.size)}</span></span>
                  <span className={ACTION[f.action][1]}>{ACTION[f.action][0]}</span>
                  {f.action !== 'DELETE' && (
                    <button className="btn btn-sm" type="button" aria-label={`${f.name} v${f.version} 다운로드`} onClick={() => download(f)}><Icon name="download" />다운로드</button>
                  )}
                </li>
              ))}
            </ul>
          </ListState>
        </div>
      </div>
    </aside>
  );
}

export default function CommitsPage() {
  const { teamId, me } = useTeam();
  const [q, setQuery] = useQuery();
  const commits = useAsync(() => getCommits(teamId), [teamId]);
  const files = useAsync(() => getFiles(teamId), [teamId]);
  const commitId = q.get('commit');

  return (
    <>
      <FilesToolbar teamId={teamId} active="commits" fileCount={files.data?.length} commitCount={commits.data?.length}
        onUpload={() => setQuery({ modal: 'upload' })} />
      <div className={`split ${commitId ? 'has-side' : ''}`}>
        <div className="panel">
          <div className="crow fhead" style={{ borderTop: 0 }}><span>종류</span><span>커밋 메시지</span><span>작성자</span><span>생성일</span><span>ID</span></div>
          <ListState loading={commits.loading} error={commits.error} onRetry={() => commits.reload()}
            empty={commits.data && !commits.data.length} emptyText="아직 커밋이 없어요. 파일을 올리면 커밋이 만들어져요.">
            {(commits.data || []).map((c) => (
              <a key={c.id} className={`crow ${String(c.id) === commitId ? 'sel' : ''}`} href={`?commit=${c.id}`}
                onClick={(e) => { e.preventDefault(); setQuery({ commit: c.id }); }}>
                <span className={TYPE[c.type][1]}>{TYPE[c.type][0]}</span>
                <span>{c.message}</span>
                <Who user={c.author} />
                <span className="muted">{formatDate(c.createdAt)}</span>
                <span className="id">{c.hash}</span>
              </a>
            ))}
          </ListState>
        </div>
        {commitId && <CommitSide key={commitId} teamId={teamId} commitId={commitId} me={me} onClose={() => setQuery({ commit: null })} />}
      </div>
      {q.get('modal') === 'upload' && (
        <UploadModal teamId={teamId} existing={files.data || []} onClose={() => setQuery({ modal: null })}
          onDone={() => { setQuery({ modal: null }); commits.reload(true); files.reload(true); }} />
      )}
    </>
  );
}
