import { AxiosError, AxiosHeaders } from 'axios'
import { describe, expect, it } from 'vitest'

import { ApiError, toApiError } from '@/shared/lib/apiErrors'

describe('toApiError', () => {
  it('서버가 내려준 message와 code를 그대로 옮긴다', () => {
    const axiosError = new AxiosError('Request failed', 'ERR_BAD_REQUEST', undefined, null, {
      status: 400,
      statusText: 'Bad Request',
      headers: new AxiosHeaders(),
      config: { headers: new AxiosHeaders() },
      data: { message: '이메일 형식이 올바르지 않습니다.', code: 'INVALID_EMAIL' },
    })

    const result = toApiError(axiosError)

    expect(result).toBeInstanceOf(ApiError)
    expect(result.status).toBe(400)
    expect(result.code).toBe('INVALID_EMAIL')
    expect(result.message).toBe('이메일 형식이 올바르지 않습니다.')
  })

  it('응답이 없는 네트워크 에러는 status 0으로 정규화한다', () => {
    const result = toApiError(new AxiosError('Network Error'))

    expect(result.status).toBe(0)
    expect(result.isNetworkError).toBe(true)
  })

  it('이미 ApiError면 그대로 돌려준다', () => {
    const original = new ApiError('중복 방지', 409, 'CONFLICT')
    expect(toApiError(original)).toBe(original)
  })

  it('알 수 없는 값도 ApiError로 감싼다', () => {
    const result = toApiError('그냥 문자열')
    expect(result).toBeInstanceOf(ApiError)
    expect(result.status).toBe(0)
  })
})
