/** API 호출 실패. status 0 = 네트워크 오류 */
export class ApiError extends Error {
  constructor(status, message, body) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}
