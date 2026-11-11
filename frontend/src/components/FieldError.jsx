/* 입력칸 아래 오류 문구 */
export default function FieldError({ id, children }) {
  if (!children) return null;
  return <p className="field-err" id={id} role="alert">{children}</p>;
}
