import type { InternalAxiosRequestConfig } from 'axios'

/** 401 재시도를 요청당 1회로 제한하는 플래그를 얹은 요청 설정 */
export type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean }

export interface RefreshResponse {
  accessToken: string
}

/** 서버 에러 응답 body. toApiError가 이 모양을 파싱한다. */
export interface ServerErrorBody {
  message?: string
  code?: string
}
