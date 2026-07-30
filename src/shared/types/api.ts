import type { InternalAxiosRequestConfig } from 'axios'

/**
 * 재발급 재시도를 요청당 1회로 제한하는 플래그를 얹은 요청 설정.
 *
 * ⚠️ 필드명이 `retry`다. 레거시 `axios.js:134`가 `originalRequest.retry`를 쓴다.
 * 관례상 `_retry`로 쓰는 코드가 많지만 여기서 이름을 바꾸면 안 된다 —
 * 같은 config 객체가 대기 큐를 거쳐 재전송되므로 판정 기준이 흔들리면 루프가 난다.
 */
export type RetriableConfig = InternalAxiosRequestConfig & { retry?: boolean }

/**
 * 서버 에러 응답 body. **중첩 구조다.**
 * 레거시 소비자 69개 파일이 `error.data.error.errorCode`로 분기한다
 * (`docs/migration/endpoints.md` E-Q7에서 전 API 공통 확인).
 */
export interface ServerErrorBody {
  error?: {
    errorCode?: string
    message?: string
  }
}

/**
 * 성공 응답 body. 에러와 대칭으로 **`success` 아래에 실린다.**
 * 레거시 호출부들이 전부 `response.data.success`로 꺼낸다.
 */
export interface ServerSuccessBody<T> {
  success?: T
}
