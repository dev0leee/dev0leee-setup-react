import { beforeEach, describe, expect, it } from 'vitest'

import { STORAGE_KEY } from '@/shared/constants/storage'
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setTokens,
} from '@/shared/lib/tokenStore'

describe('tokenStore', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('레거시가 JSON으로 저장해둔 따옴표 감싼 값을 벗겨서 읽는다', () => {
    // 기존 사용자 기기에 이 형태로 남아 있다. 벗기지 않으면 Bearer "eyJ..."가 나간다.
    localStorage.setItem(STORAGE_KEY.ACCESS_TOKEN, '"eyJhbGciOiJIUzI1NiJ9"')

    expect(getAccessToken()).toBe('eyJhbGciOiJIUzI1NiJ9')
  })

  it('따옴표가 없는 값은 그대로 읽는다', () => {
    localStorage.setItem(STORAGE_KEY.ACCESS_TOKEN, 'eyJhbGciOiJIUzI1NiJ9')

    expect(getAccessToken()).toBe('eyJhbGciOiJIUzI1NiJ9')
  })

  it('따옴표로 시작·끝나지만 JSON이 아니면 원본을 돌려준다', () => {
    localStorage.setItem(STORAGE_KEY.ACCESS_TOKEN, '"깨진값')

    expect(getAccessToken()).toBe('"깨진값')
  })

  it('쓸 때는 따옴표를 붙이지 않는다', () => {
    setAccessToken({ token: 'raw-token' })

    // 읽기는 벗기고 쓰기는 raw — 이 비대칭이 레거시 호환의 핵심이다.
    expect(localStorage.getItem(STORAGE_KEY.ACCESS_TOKEN)).toBe('raw-token')
  })

  it('null을 쓰면 키를 제거한다', () => {
    setAccessToken({ token: 'raw-token' })
    setAccessToken({ token: null })

    expect(localStorage.getItem(STORAGE_KEY.ACCESS_TOKEN)).toBeNull()
    expect(getAccessToken()).toBeNull()
  })

  it('빈 문자열은 null로 취급한다', () => {
    localStorage.setItem(STORAGE_KEY.ACCESS_TOKEN, '')

    // 레거시도 빈 토큰을 "없음"으로 다뤘다(자동 로그인 성공 판정이 이 값에 의존한다).
    expect(getAccessToken()).toBeNull()
  })

  it('두 토큰을 한 번에 저장하고 지운다', () => {
    setTokens({ accessToken: 'a', refreshToken: 'r' })
    expect(getAccessToken()).toBe('a')
    expect(getRefreshToken()).toBe('r')

    clearTokens()
    expect(getAccessToken()).toBeNull()
    expect(getRefreshToken()).toBeNull()
  })
})
