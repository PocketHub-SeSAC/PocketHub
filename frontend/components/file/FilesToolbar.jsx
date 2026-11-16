'use client';
/* [담당 3] 파일·커밋 화면 위쪽: 파일 / 커밋 이력 탭 + 업로드 버튼 */
import Link from 'next/link';
import Icon from '@/components/common/Icon';

export default function FilesToolbar({ teamId, active, fileCount, commitCount, onUpload }) {
  return (
    <div className='toolbar'>
      <div className='tabs' role='tablist'>
        <Link className='tab' role='tab' href={`/teams/${teamId}/files`} aria-selected={active === 'files'}>
          파일 {fileCount !== undefined && <span className='n'>{fileCount}</span>}
        </Link>
        <Link className='tab' role='tab' href={`/teams/${teamId}/commits`} aria-selected={active === 'commits'}>
          커밋 이력 {commitCount !== undefined && <span className='n'>{commitCount}</span>}
        </Link>
      </div>
      <button className='btn btn-ink' type='button' onClick={onUpload}><Icon name='upload' />파일 업로드</button>
    </div>
  );
}
