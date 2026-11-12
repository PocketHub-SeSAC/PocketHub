/* 화면 본문 틀 (가운데 정렬된 본문 영역) */
export default function PageWrap({ children }) {
  return <main><div className='wrap'>{children}</div></main>;
}
