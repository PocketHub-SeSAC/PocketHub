/* 모든 목록 공통: 로딩 / 오류 / 빈 상태. 셋 다 아니면 children 을 그린다 */
export default function ListState({ loading, error, empty, emptyText, emptyAction, onRetry, children }) {
  if (loading) {
    return <div className="state-box loading" role="status"><span>불러오는 중<span className="dots" /></span></div>;
  }
  if (error) {
    return (
      <div className="state-box err" role="alert">
        <span>{error.message || '불러오지 못했어요.'}</span>
        {onRetry && <button className="btn btn-sm" type="button" onClick={onRetry}>다시 시도</button>}
      </div>
    );
  }
  if (empty) {
    return (
      <div className="state-box">
        <span className="muted">{emptyText}</span>
        {emptyAction}
      </div>
    );
  }
  return children;
}
