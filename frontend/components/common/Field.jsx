/* 라벨 + 입력칸 + 오류 문구 (input / textarea / select 공용) */
import FieldError from './FieldError';

export default function Field({ id, label, required, optional, error, as = 'input', children, hint, ...rest }) {
  const Tag = as;
  const errId = error ? `${id}-err` : undefined;
  return (
    <div className='field'>
      <label htmlFor={id}>
        {label}
        {required && <span className='req'>필수</span>}
        {optional && <span className='opt'>선택</span>}
      </label>
      <Tag className='input' id={id} aria-invalid={error ? 'true' : undefined} aria-describedby={errId} {...rest}>{children}</Tag>
      {hint && !error && <p className='sub-hint' style={{ marginTop: 6 }}>{hint}</p>}
      <FieldError id={errId}>{error}</FieldError>
    </div>
  );
}
