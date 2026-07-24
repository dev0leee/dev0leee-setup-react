import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'

import { env } from '@/config/env'
import { toApiError } from '@/shared/lib/apiErrors'
import { broadcastToken } from '@/shared/lib/authChannel'
import { getAccessToken, setAccessToken } from '@/shared/lib/tokenStore'

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean }

interface RefreshResponse {
  accessToken: string
}

export const REFRESH_ENDPOINT = '/token-refresh'

/**
 * 인터셉터가 붙지 않은 전용 인스턴스.
 * refresh 요청을 api 인스턴스로 보내면 401 시 인터셉터가 또 refresh를 불러 무한 루프가 된다.
 */
const refreshClient = axios.create({
  baseURL: env.VITE_API_URL,
  withCredentials: true, // Refresh Token 쿠키 전송
  timeout: 10_000,
})

export const api = axios.create({
  baseURL: env.VITE_API_URL,
  withCredentials: true,
  timeout: 15_000,
})

/** Web Locks를 못 쓰는 환경(비 secure context)용 폴백 */
let fallbackInflight: Promise<string> | null = null

async function performRefresh(failedToken: string | null): Promise<string> {
  // 락 획득 시점에 토큰이 이미 바뀌었다면 다른 요청/다른 탭이 갱신을 끝낸 것이다.
  // 이 비교 한 줄이 탭 내부 동시성과 탭 간 동시성을 동시에 해결한다.
  const current = getAccessToken()
  if (current && current !== failedToken) return current

  const { data } = await refreshClient.post<RefreshResponse>(REFRESH_ENDPOINT)
  setAccessToken(data.accessToken)
  broadcastToken(data.accessToken)
  return data.accessToken
}

function refreshAccessToken(failedToken: string | null): Promise<string> {
  if ('locks' in navigator) {
    // Web Locks는 origin 단위라 탭을 가로질러 직렬화된다.
    return navigator.locks.request('auth:refresh', () => performRefresh(failedToken))
  }

  fallbackInflight ??= performRefresh(failedToken).finally(() => {
    fallbackInflight = null
  })
  return fallbackInflight
}

api.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetriableConfig | undefined

    // 재시도는 딱 1회. _retried 플래그가 없으면 401 루프에 빠진다.
    // 백엔드가 "권한 부족"까지 401로 주면 여기서 무한히 돈다 - 403이어야 한다.
    if (error.response?.status !== 401 || !config || config._retried) {
      return Promise.reject(toApiError(error))
    }

    config._retried = true
    const failedToken = config.headers.Authorization?.toString().replace('Bearer ', '') ?? null

    try {
      const token = await refreshAccessToken(failedToken)
      config.headers.Authorization = `Bearer ${token}`
      return await api(config)
    } catch (refreshError) {
      // Refresh 실패 = 세션 종료.
      // 여기서 화면을 전환하지 않는다. 라우팅은 AuthProvider가 담당한다(관심사 분리).
      setAccessToken(null)
      return Promise.reject(toApiError(refreshError))
    }
  },
)
