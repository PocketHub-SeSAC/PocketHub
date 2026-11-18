/* 파일 업로드 규칙 (화면 검증과 목업 서버 검증이 함께 쓴다) */

/* - 확정: 파일 1개 = 커밋 1개 (한 번에 1개만 업로드)
   - ⚠ 허용 확장자·최대 크기는 아직 미정 (임시값).
     정해지면 아래 값만 바꾸면 화면 검증과 목업 서버 검증이 함께 바뀐다.
     ALLOWED_EXTENSIONS 를 null 로 두면 확장자 검사를 하지 않는다. */
export const UPLOAD_RULES = {
  ALLOWED_EXTENSIONS: ['pdf', 'png', 'jpg', 'jpeg', 'gif', 'txt', 'md', 'docx', 'xlsx', 'pptx', 'hwp', 'zip'], // (임시값)
  MAX_FILE_SIZE_MB: 10,
  MAX_ALL_FILE_SIZE_MB: 50
};

export const ONE_FILE_ONLY = '파일은 한 번에 1개만 올릴 수 있어요.';

export const extOf = (name) => {
  const i = String(name).lastIndexOf('.');
  return i > 0 ? String(name).slice(i + 1).toLowerCase() : '';
};

/** 파일 하나 검사 → 문제가 있으면 한국어 오류 문구, 없으면 null */
export function validateFile(files = [], rules = UPLOAD_RULES, prevFiles = []) {
  if (!files || files.length == 0) return ['올릴 파일을 골라 주세요.'];
  let fileSize = 0;
  let errMsg = [];

  let prevFileNames = prevFiles.map(p => extOf(p.name))

  files.forEach(file => {
    const ext = extOf(file.name);

    if(prevFileNames && prevFileNames.length > 0) {
      if(prevFileNames.includes(ext)) {
        errMsg = [...errMsg, `${file.name}: 한 커밋에 같은 이름의 파일을 중복 등록할 수는 없습니다.`];
        return;
      }
    }

    if (rules.ALLOWED_EXTENSIONS && !rules.ALLOWED_EXTENSIONS.includes(ext)) {
      errMsg = [...errMsg, `${file.name}: 올릴 수 없는 형식이에요. (가능: ${rules.ALLOWED_EXTENSIONS.join(', ')})`];
      return;
    }
    if (file.size > rules.MAX_FILE_SIZE_MB * 1024 * 1024) {
      errMsg = [...errMsg, `${file.name}: ${rules.MAX_FILE_SIZE_MB}MB 이하만 올릴 수 있어요.`]
      return;
    }
    if (file.size === 0) {
      errMsg = [...errMsg, `${file.name}: 빈 파일은 올릴 수 없어요.`];
      return;
    }
    fileSize += file.size;

    return file;
  })
  if(fileSize > rules.MAX_ALL_FILE_SIZE_MB * 1024 * 1024) {
    errMsg = [...errMsg, `전체 파일 크기: ${rules.MAX_ALL_FILE_SIZE_MB}MB 이하만 올릴 수 있어요.`];
  }
  if(errMsg.length > 0) return errMsg;
  return null;
}
