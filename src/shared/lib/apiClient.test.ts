import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { API_PREFIX, REFRESH_ENDPOINT } from '@/shared/constants/api'
import { STORAGE_KEY } from '@/shared/constants/storage'
import { url } from '@/testing/mocks/handlers'
import { server } from '@/testing/mocks/server'

/**
 * HTTP 레이어 재작성은 이 이관에서 가장 위험한 부분이다(계획서 R12).
 * 재발급 트리거·중복 방지·대기 큐·자동 로그인 4개 경로를 여기서 고정한다.
 */

const PROTECTED_PATH = `${API_PREFIX.APARTMANT}/login/info`

const tokenErrorResponse = () => {
  // ⚠️ 재발급 트리거는 상태코드가 아니라 이 body다.
  return HttpResponse.json(
    { error: { errorCode: 'EXPIRED_TOKEN', message: '만료' } },
    { status: 401 },
  )
}

/**
 * `apiClient`는 모듈 스코프에 재발급 락과 대기 큐를 들고 있고, 임포트 시점에
 * authStore를 구독한다. 테스트가 서로 오염되지 않도록 매번 모듈을 새로 만든다.
 */
const loadHttpLayer = async () => {
  vi.resetModules()

  const { api } = await import('@/shared/lib/apiClient')
  const tokenStore = await import('@/shared/lib/tokenStore')
  const { useAuthStore } = await import('@/shared/stores/authStore')

  return { api, tokenStore, useAuthStore }
}

describe('apiClient', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('저장된 accessToken을 Authorization 헤더로 보낸다', async () => {
    localStorage.setItem(STORAGE_KEY.ACCESS_TOKEN, 'stored-token')
    const { api } = await loadHttpLayer()

    let sent: string | null = null
    server.use(
      http.get(url({ path: PROTECTED_PATH }), ({ request }) => {
        sent = request.headers.get('authorization')
        return HttpResponse.json({ success: {} })
      }),
    )

    await api.get(PROTECTED_PATH)

    expect(sent).toBe('Bearer stored-token')
  })

  it('errorCode가 EXPIRED_TOKEN이면 재발급하고 새 토큰으로 재시도한다', async () => {
    localStorage.setItem(STORAGE_KEY.ACCESS_TOKEN, 'old-token')
    localStorage.setItem(STORAGE_KEY.REFRESH_TOKEN, 'refresh-token')
    const { api, tokenStore } = await loadHttpLayer()

    let attempts = 0
    let refreshHeader: string | null = null
    const authorizations: (string | null)[] = []

    server.use(
      http.get(url({ path: PROTECTED_PATH }), ({ request }) => {
        attempts += 1
        authorizations.push(request.headers.get('authorization'))
        if (attempts === 1) return tokenErrorResponse()
        return HttpResponse.json({ success: { ok: true } })
      }),
      http.post(url({ path: REFRESH_ENDPOINT }), ({ request }) => {
        refreshHeader = request.headers.get('refresh-token')
        // 새 토큰은 응답 **헤더**로 온다.
        return HttpResponse.json({}, { headers: { authorization: 'new-token' } })
      }),
    )

    const response = await api.get(PROTECTED_PATH)

    expect(response.data).toEqual({ success: { ok: true } })
    expect(refreshHeader).toBe('refresh-token')
    expect(authorizations).toEqual(['Bearer old-token', 'Bearer new-token'])
    expect(tokenStore.getAccessToken()).toBe('new-token')
  })

  it('401이라도 errorCode가 토큰 에러가 아니면 재발급하지 않는다', async () => {
    localStorage.setItem(STORAGE_KEY.ACCESS_TOKEN, 'old-token')
    localStorage.setItem(STORAGE_KEY.REFRESH_TOKEN, 'refresh-token')
    const { api } = await loadHttpLayer()

    let refreshCalls = 0
    server.use(
      http.get(url({ path: PROTECTED_PATH }), () => {
        return HttpResponse.json(
          { error: { errorCode: 'NOT_HEAD_AUTHORITY', message: '권한이 없습니다' } },
          { status: 401 },
        )
      }),
      http.post(url({ path: REFRESH_ENDPOINT }), () => {
        refreshCalls += 1
        return HttpResponse.json({}, { headers: { authorization: 'new-token' } })
      }),
    )

    await expect(api.get(PROTECTED_PATH)).rejects.toMatchObject({
      code: 'NOT_HEAD_AUTHORITY',
      message: '권한이 없습니다',
      status: 401,
    })
    expect(refreshCalls).toBe(0)
  })

  it('동시에 만료된 요청 3건이 재발급을 한 번만 호출한다', async () => {
    localStorage.setItem(STORAGE_KEY.ACCESS_TOKEN, 'old-token')
    localStorage.setItem(STORAGE_KEY.REFRESH_TOKEN, 'refresh-token')
    const { api } = await loadHttpLayer()

    let refreshCalls = 0

    server.use(
      http.get(url({ path: PROTECTED_PATH }), ({ request }) => {
        // 헌 토큰으로 온 요청만 만료로 답한다 = 재발급 후에는 성공한다.
        if (request.headers.get('authorization') === 'Bearer old-token') {
          return tokenErrorResponse()
        }
        return HttpResponse.json({ success: { ok: true } })
      }),
      http.post(url({ path: REFRESH_ENDPOINT }), async () => {
        refreshCalls += 1
        // 재발급이 느린 상황을 만들어 뒤따르는 요청이 큐에 쌓이게 한다.
        await new Promise((resolve) => {
          setTimeout(resolve, 20)
        })
        return HttpResponse.json({}, { headers: { authorization: 'new-token' } })
      }),
    )

    const responses = await Promise.all([
      api.get(PROTECTED_PATH),
      api.get(PROTECTED_PATH),
      api.get(PROTECTED_PATH),
    ])

    expect(refreshCalls).toBe(1)
    responses.forEach((response) => {
      expect(response.data).toEqual({ success: { ok: true } })
    })
  })

  it('refreshToken이 없으면 자동 로그인을 시작하고 요청을 큐에 담아둔다', async () => {
    localStorage.setItem(STORAGE_KEY.ACCESS_TOKEN, 'old-token')
    const { api, useAuthStore } = await loadHttpLayer()

    server.use(
      http.get(url({ path: PROTECTED_PATH }), ({ request }) => {
        if (request.headers.get('authorization') === 'Bearer old-token') return tokenErrorResponse()
        return HttpResponse.json({ success: { ok: true } })
      }),
    )

    const pending = api.get(PROTECTED_PATH)

    // 큐에 들어갔으므로 아직 끝나지 않는다. 플래그만 올라간다.
    await vi.waitFor(() => {
      expect(useAuthStore.getState().isAutoLoginInProgress).toBe(true)
    })

    // 자동 로그인이 성공한 상황을 재현한다: 토큰 저장 → 플래그 내리기.
    const { setAccessToken } = await import('@/shared/lib/tokenStore')
    setAccessToken({ token: 'relogin-token' })
    useAuthStore.getState().setAutoLoginInProgress(false)

    await expect(pending).resolves.toMatchObject({ data: { success: { ok: true } } })
  })

  it('자동 로그인이 실패하면 대기 요청을 전부 거부한다', async () => {
    localStorage.setItem(STORAGE_KEY.ACCESS_TOKEN, 'old-token')
    const { api, useAuthStore } = await loadHttpLayer()

    server.use(
      http.get(url({ path: PROTECTED_PATH }), () => {
        return tokenErrorResponse()
      }),
    )

    const pending = api.get(PROTECTED_PATH)

    await vi.waitFor(() => {
      expect(useAuthStore.getState().isAutoLoginInProgress).toBe(true)
    })

    // 자동 로그인 실패 = 토큰이 없는 상태로 플래그가 내려간다.
    localStorage.removeItem(STORAGE_KEY.ACCESS_TOKEN)
    useAuthStore.getState().setAutoLoginInProgress(false)

    await expect(pending).rejects.toThrow('자동 로그인 실패')
  })

  it('publicApi는 토큰을 붙이지 않고 에러만 정규화한다', async () => {
    localStorage.setItem(STORAGE_KEY.ACCESS_TOKEN, 'stored-token')
    vi.resetModules()
    const { publicApi } = await import('@/shared/lib/apiClient')

    let sent: string | null = null
    server.use(
      http.get(url({ path: `${API_PREFIX.APARTMANT}/kmc` }), ({ request }) => {
        sent = request.headers.get('authorization')
        return HttpResponse.json(
          { error: { errorCode: 'KMC_ERROR', message: '유효시간이 만료되었습니다' } },
          { status: 400 },
        )
      }),
    )

    await expect(publicApi.get(`${API_PREFIX.APARTMANT}/kmc`)).rejects.toMatchObject({
      code: 'KMC_ERROR',
      status: 400,
    })
    expect(sent).toBeNull()
  })
})
