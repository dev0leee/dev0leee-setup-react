import axios, { type AxiosError } from 'axios'
import { stringify } from 'qs'

import { env } from '@/config/env'
import { API_TIMEOUT_MS, REFRESH_TIMEOUT_MS } from '@/shared/constants/http'
import { toApiError } from '@/shared/lib/apiErrors'
import { broadcastToken } from '@/shared/lib/authChannel'
import { getAccessToken, setAccessToken } from '@/shared/lib/tokenStore'
import type { RefreshResponse, RetriableConfig } from '@/shared/types/api'

export const REFRESH_ENDPOINT = '/token-refresh'

/**
 * 세 인스턴스가 공유하는 설정.
 *
 * paramsSerializer: 배열 파라미터를 `?state=A&state=B`(repeat)로 직렬화한다.
 * axios 기본값은 `state[]=A&state[]=B`라 백엔드가 못 받는 경우가 많다.
 * 쿼리 파라미터는 문자열로 이어붙이지 말고 요청의 `params`로 넘긴다(03-api).
 */
const baseConfig = {
  baseURL: env.VITE_API_URL,
  withCredentials: true, // Refresh Token 쿠키 전송
  paramsSerializer: (params: Record<string, unknown>) => {
    return stringify(params, { arrayFormat: 'repeat' })
  },
}

/**
 * 인터셉터가 붙지 않은 전용 인스턴스.
 * refresh 요청을 api 인스턴스로 보내면 401 시 인터셉터가 또 refresh를 불러 무한 루프가 된다.
 */
const refreshClient = axios.create({ ...baseConfig, timeout: REFRESH_TIMEOUT_MS })

/** 인증이 필요한 요청. 토큰 주입 + 401 refresh + 에러 정규화가 붙는다. */
export const api = axios.create({ ...baseConfig, timeout: API_TIMEOUT_MS })

/**
 * 인증이 필요 없는 요청. 토큰을 붙이지 않고 401 refresh도 하지 않는다.
 * 에러 정규화만 공유한다.
 *
 * 세션 복원처럼 refresh 엔드포인트를 직접 부르는 요청은 반드시 여기를 써야 한다.
 * api로 보내면 401 시 인터셉터가 같은 엔드포인트로 또 refresh를 걸어 루프가 된다.
 */
export const publicApi = axios.create({ ...baseConfig, timeout: API_TIMEOUT_MS })

publicApi.interceptors.response.use(
  (response) => {
    return response
  },
  (error: AxiosError) => {
    return Promise.reject(toApiError({ error }))
  },
)

/** Web Locks를 못 쓰는 환경(비 secure context)용 폴백 */
let fallbackInflight: Promise<string> | null = null

const performRefresh = async ({ failedToken }: { failedToken: string | null }): Promise<string> => {
  // 락 획득 시점에 토큰이 이미 바뀌었다면 다른 요청/다른 탭이 갱신을 끝낸 것이다.
  // 이 비교 한 줄이 탭 내부 동시성과 탭 간 동시성을 동시에 해결한다.
  const current = getAccessToken()
  if (current && current !== failedToken) return current

  const { data } = await refreshClient.post<RefreshResponse>(REFRESH_ENDPOINT)
  setAccessToken({ token: data.accessToken })
  broadcastToken({ token: data.accessToken })
  return data.accessToken
}

const refreshAccessToken = ({ failedToken }: { failedToken: string | null }): Promise<string> => {
  if ('locks' in navigator) {
    // Web Locks는 origin 단위라 탭을 가로질러 직렬화된다.
    return navigator.locks.request('auth:refresh', () => {
      return performRefresh({ failedToken })
    })
  }

  fallbackInflight ??= performRefresh({ failedToken }).finally(() => {
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
  (response) => {
    return response
  },
  async (error: AxiosError) => {
    const config = error.config as RetriableConfig | undefined

    // 재시도는 딱 1회. _retried 플래그가 없으면 401 루프에 빠진다.
    // 백엔드가 "권한 부족"까지 401로 주면 여기서 무한히 돈다 - 403이어야 한다.
    if (error.response?.status !== 401 || !config || config._retried) {
      return Promise.reject(toApiError({ error }))
    }

    config._retried = true
    const failedToken = config.headers.Authorization?.toString().replace('Bearer ', '') ?? null

    try {
      const token = await refreshAccessToken({ failedToken })
      config.headers.Authorization = `Bearer ${token}`
      return await api(config)
    } catch (refreshError) {
      // Refresh 실패 = 세션 종료.
      // 여기서 화면을 전환하지 않는다. 라우팅은 AuthProvider가 담당한다(관심사 분리).
      setAccessToken({ token: null })
      return Promise.reject(toApiError({ error: refreshError }))
    }
  },
)
