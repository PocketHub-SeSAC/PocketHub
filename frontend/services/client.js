/* 공통 API 클라이언트: 목업/실서버 전환, 토큰 헤더, 401·404 공통 처리.
   응답 풀기·오류 문구는 adapter.js 에 모아 둔다 */
import { unwrap, toApiError } from './adapter';
import { getToken, clearToken } from './token';

// NEXT_PUBLIC_USE_MOCK=true : 브라우저 안 목업 서버(mocks/)로 보낸다
// NEXT_PUBLIC_USE_MOCK=false: NEXT_PUBLIC_API_URL + 경로로 실제 요청
// 인증 필요한 API(route.auth !== false)에만 Authorization: Bearer 토큰을 붙인다
export const USE_MOCK = String(process.env.NEXT_PUBLIC_USE_MOCK ?? 'true').toLowerCase() !== 'false';
const BASE_URL = String(process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');

/* 화면 쪽(라우터)에서 401·404 때 할 일을 등록한다 */
const handlers = { unauthorized: null, notFound: null };
export function setApiHandlers(next) { Object.assign(handlers, next); }

export function buildPath(path, params = {}) {
  return path.replace(/\{(\w+)\}/g, (_, k) => {
    if (params[k] === undefined || params[k] === null || params[k] === '') throw new Error(`경로 값 없음: ${k} (${path})`);
    return encodeURIComponent(params[k]);
  });
}

function buildQuery(query) {
  if (!query) return '';
  const qs = new URLSearchParams();
  Object.entries(query).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') qs.append(k, v); });
  const s = qs.toString();
  return s ? `?${s}` : '';
}

function filenameFrom(disposition) {
  if (!disposition) return '';
  const star = /filename\*=UTF-8''([^;]+)/i.exec(disposition);
  if (star) return decodeURIComponent(star[1]);
  const plain = /filename="?([^";]+)"?/i.exec(disposition);
  return plain ? plain[1] : '';
}

/**
 * @param route   { key, method, path, auth? }  ← 각 도메인 api 파일에 정의
 * @param options params(경로 값), query, body(객체 또는 FormData), blob(true면 파일 받기),
 *                handle404(false면 404를 화면이 직접 처리)
 */
export async function request(route, { params, query, body, blob = false, handle404 = true } = {}) {
  const path = buildPath(route.path, params);
  const headers = {};
  if (route.auth !== false) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let res;
  if (USE_MOCK) {
    const { mockFetch } = await import('@/mocks/server');
    res = await mockFetch(route, { path, params: params || {}, query: query || {}, body, headers });
  } else {
    const isForm = typeof FormData !== 'undefined' && body instanceof FormData;
    if (body !== undefined && !isForm) headers['Content-Type'] = 'application/json';
    try {
      const r = await fetch(BASE_URL + path + buildQuery(query), {
        method: route.method,
        headers,
        body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
      });
      if (blob && r.ok) {
        res = { status: r.status, blob: await r.blob(), filename: filenameFrom(r.headers.get('Content-Disposition')) };
      } else {
        const text = await r.text();
        let data = null;
        try { data = text ? JSON.parse(text) : null; } catch { data = { message: text }; }
        res = { status: r.status, data };
      }
    } catch {
      res = { status: 0, data: null };
    }
  }

  if (res.status >= 200 && res.status < 300) {
    return blob ? { blob: res.blob, filename: res.filename } : unwrap(res.data);
  }
  const err = toApiError(res.status, res.data);
  if (res.status === 401 && route.auth !== false) {
    clearToken();
    handlers.unauthorized && handlers.unauthorized(err);
  }
  if (res.status === 404 && handle404) handlers.notFound && handlers.notFound(err);
  throw err;
}

/** 받은 파일(blob)을 브라우저에서 저장 */
export function saveBlob({ blob, filename }, fallbackName = 'download') {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename || fallbackName;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
