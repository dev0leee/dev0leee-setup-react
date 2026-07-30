import { AxiosError, AxiosHeaders } from 'axios'
import { describe, expect, it } from 'vitest'

import { ApiError, toApiError } from '@/shared/lib/apiErrors'

describe('toApiError', () => {
  it('중첩된 error 객체의 message와 errorCode를 그대로 옮긴다', () => {
    // 서버 에러 body는 `{ error: { errorCode, message } }` 중첩 구조다.
    // 레거시 소비자 69개 파일이 `error.data.error.errorCode`로 분기한다.
    const axiosError = new AxiosError('Request failed', 'ERR_BAD_REQUEST', undefined, null, {
      status: 400,
      statusText: 'Bad Request',
      headers: new AxiosHeaders(),
      config: { headers: new AxiosHeaders() },
      data: {
        error: { errorCode: 'INVALID_PASSWORD', message: '비밀번호가 일치하지 않습니다.' },
      },
    })

    const result = toApiError({ error: axiosError })

    expect(result).toBeInstanceOf(ApiError)
    expect(result.status).toBe(400)
    expect(result.code).toBe('INVALID_PASSWORD')
    expect(result.message).toBe('비밀번호가 일치하지 않습니다.')
  })

  it('평면 구조 body는 errorCode를 못 읽고 axios 메시지로 폴백한다', () => {
    // 중첩되지 않은 응답이 오면 code가 undefined다.
    // errorCode 분기가 조용히 빠지는 상황이라 회귀 감지 목적으로 고정해둔다.
    const axiosError = new AxiosError('Request failed', 'ERR_BAD_REQUEST', undefined, null, {
      status: 400,
      statusText: 'Bad Request',
      headers: new AxiosHeaders(),
      config: { headers: new AxiosHeaders() },
      data: { message: '평면 구조', code: 'FLAT_CODE' },
    })

    const result = toApiError({ error: axiosError })

    expect(result.code).toBeUndefined()
    expect(result.message).toBe('Request failed')
  })

  it('응답이 없는 네트워크 에러는 status 0으로 정규화한다', () => {
    const result = toApiError({ error: new AxiosError('Network Error') })

    expect(result.status).toBe(0)
    expect(result.isNetworkError).toBe(true)
  })

  it('이미 ApiError면 그대로 돌려준다', () => {
    const original = new ApiError('중복 방지', 409, 'CONFLICT')
    expect(toApiError({ error: original })).toBe(original)
  })

  it('알 수 없는 값도 ApiError로 감싼다', () => {
    const result = toApiError({ error: '그냥 문자열' })
    expect(result).toBeInstanceOf(ApiError)
    expect(result.status).toBe(0)
  })
})
