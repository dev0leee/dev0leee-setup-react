import axios from 'axios'

/**
 * 서버/네트워크 에러를 앱 공통 타입으로 정규화한다.
 * 화면 코드가 axios를 직접 알 필요가 없게 만드는 것이 목적.
 *
 * 주의: tsconfig의 erasableSyntaxOnly 때문에 생성자 파라미터 프로퍼티
 * (constructor(readonly status: number))는 쓸 수 없다.
 */
export class ApiError extends Error {
  readonly status: number
  readonly code: string | undefined

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }

  /** 네트워크 단절 / 타임아웃 등 서버 응답 자체가 없는 경우 */
  get isNetworkError(): boolean {
    return this.status === 0
  }
}

interface ServerErrorBody {
  message?: string
  code?: string
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error

  if (axios.isAxiosError(error)) {
    const status = error.response?.status ?? 0
    const body = error.response?.data as ServerErrorBody | undefined
    return new ApiError(body?.message ?? error.message, status, body?.code)
  }

  if (error instanceof Error) return new ApiError(error.message, 0)

  return new ApiError('알 수 없는 오류가 발생했습니다.', 0)
}
