import axios, { type AxiosError, type AxiosResponse } from 'axios'

import { env } from '@/config/env'
import {
  REFRESH_ENDPOINT,
  SERVER_ERROR_STATUS_MAX,
  SERVER_ERROR_STATUS_MIN,
  TOKEN_ERROR_CODE,
} from '@/shared/constants/api'
import { AUTO_LOGIN_FAILED_MESSAGE } from '@/shared/constants/message'
import { toApiError } from '@/shared/lib/apiErrors'
import { sentryApiError } from '@/shared/lib/sentryApiError'
import { getAccessToken, getRefreshToken, setAccessToken } from '@/shared/lib/tokenStore'
import { useAuthStore } from '@/shared/stores/authStore'
import type { RetriableConfig } from '@/shared/types/api'

/**
 * 레거시 `src/api/axios.js` 재작성.
 *
 * 템플릿 원본은 **쿠키 + Web Locks + HTTP 401** 기반이었다. 세 전제가 모두 다르다:
 *  - 토큰은 요청/응답 **헤더**로 오간다 (쿠키 없음)
 *  - 재발급 트리거는 401이 아니라 **응답 body의 errorCode**
 *  - 재발급이 실패하면 저장된 아이디·비밀번호로 **자동 로그인**한다
 *
 * `docs/migration/decisions/auth-strategy.md` · `tech-mapping.md` §2.
 */

/**
 * ⚠️ **타임아웃을 걸지 않는다.** 레거시 config는 `{ baseURL }`뿐이었다.
 * 템플릿의 15초 타임아웃을 그대로 두면 첨부 업로드가 실패한다.
 *
 * ⚠️ **paramsSerializer도 두지 않는다.** 레거시는 axios 기본 직렬화를 썼다.
 * 템플릿의 `arrayFormat: 'repeat'`로 바꾸면 배열 파라미터의 쿼리스트링이 달라진다.
 * 다른 형식이 필요한 요청은 그 요청에서만 지정한다.
 */
const baseConfig = { baseURL: env.VITE_API_URL }

/** 인증이 필요 없는 요청. 레거시 `client`. */
export const publicApi = axios.create(baseConfig)

/** 인증이 필요한 요청. 레거시 `auth`. 토큰 주입 + 재발급 + 자동 로그인이 붙는다. */
export const api = axios.create(baseConfig)

/** 5xx만 Sentry로 보낸다 (레거시와 동일). */
const reportServerError = (error: AxiosError): void => {
  const status = error.response?.status ?? 0
  if (status >= SERVER_ERROR_STATUS_MIN && status < SERVER_ERROR_STATUS_MAX) {
    sentryApiError({ error })
  }
}

const isTokenErrorCode = (code: string | undefined): boolean => {
  return code === TOKEN_ERROR_CODE.EXPIRED || code === TOKEN_ERROR_CODE.INVALID
}

publicApi.interceptors.response.use(
  (response) => {
    return response
  },
  (error: AxiosError) => {
    reportServerError(error)
    return Promise.reject(toApiError({ error }))
  },
)

api.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ───────────────────────────────────────────────────────────────────────────────
// 대기 요청 큐
//
// 레거시는 Pinia 스토어(`stores/pendingRequests.js`)로 관리했지만 **UI가 이 큐를
// 읽지 않는다.** 리렌더가 필요 없으므로 모듈 스코프 배열로 충분하다
// (`tech-mapping.md` §2-2).
//
// 레거시 `getAllRequests()`는 `_.cloneDeep`으로 큐를 깊은 복사했다. axios config를
// 깊은 복사하면 `AxiosHeaders` 인스턴스가 평범한 객체로 바뀌지만 그래도 동작하므로
// 결과는 같다. 여기서는 배열만 얕게 복사한다.
// ───────────────────────────────────────────────────────────────────────────────

interface PendingRequest {
  config: RetriableConfig
  resolve: (response: AxiosResponse) => void
  reject: (reason: unknown) => void
}

let pendingRequests: PendingRequest[] = []

/** 큐를 비우면서 내용을 가져온다. 드레인 도중 새로 들어온 요청이 섞이지 않게 한다. */
const takePendingRequests = (): PendingRequest[] => {
  const taken = pendingRequests
  pendingRequests = []
  return taken
}

const enqueue = (config: RetriableConfig): Promise<AxiosResponse> => {
  return new Promise<AxiosResponse>((resolve, reject) => {
    pendingRequests.push({ config, resolve, reject })
  })
}

const replay = ({ config, token }: { config: RetriableConfig; token: string }) => {
  config.headers.Authorization = `Bearer ${token}`
  return api(config)
}

/**
 * 요청을 큐에 넣고 자동 로그인을 시작시킨다.
 * 실제 재로그인은 `isAutoLoginInProgress`를 보는 쪽(인증 슬라이스)이 수행한다.
 */
const enqueueAndStartAutoLogin = (config: RetriableConfig): Promise<AxiosResponse> => {
  const promise = enqueue(config)
  const { isAutoLoginInProgress, setAutoLoginInProgress } = useAuthStore.getState()
  if (!isAutoLoginInProgress) setAutoLoginInProgress(true)
  return promise
}

// ───────────────────────────────────────────────────────────────────────────────
// 토큰 재발급
// ───────────────────────────────────────────────────────────────────────────────

/** 재발급 요청이 동시에 여러 번 나가는 것을 막는 모듈 레벨 락. */
let isRefreshingToken = false

const requestNewAccessToken = async ({
  refreshToken,
}: {
  refreshToken: string
}): Promise<string> => {
  // 인터셉터가 없는 publicApi로 보낸다. api로 보내면 재발급 실패가 또 재발급을 부른다.
  const response = await publicApi.post(
    REFRESH_ENDPOINT,
    {},
    { headers: { 'refresh-token': refreshToken } },
  )
  // 새 토큰은 **응답 헤더**로 온다.
  return String(response.headers.authorization)
}

api.interceptors.response.use(
  (response) => {
    return response
  },
  async (error: AxiosError) => {
    reportServerError(error)

    const config = error.config as RetriableConfig | undefined
    const apiError = toApiError({ error })

    // 이미 한 번 재발급을 거친 요청은 다시 시도하지 않는다. 없으면 무한 루프가 된다.
    if (!config || config.retry) return Promise.reject(apiError)

    // 서버 응답이 있고 그 body의 errorCode가 토큰 만료·무효일 때만 재발급한다.
    // 네트워크 단절(response 없음)은 재발급 대상이 아니다.
    if (!error.response || !isTokenErrorCode(apiError.code)) return Promise.reject(apiError)

    config.retry = true

    const refreshToken = getRefreshToken()
    // refreshToken이 아예 없으면 재발급할 수 없다 → 자동 로그인으로 넘긴다.
    if (!refreshToken) return enqueueAndStartAutoLogin(config)

    // 다른 요청이 이미 재발급 중이면 줄을 선다. 끝나면 새 토큰으로 replay된다.
    if (isRefreshingToken) return enqueue(config)

    isRefreshingToken = true

    try {
      const newAccessToken = await requestNewAccessToken({ refreshToken })
      setAccessToken({ token: newAccessToken })

      for (const pending of takePendingRequests()) {
        replay({ config: pending.config, token: newAccessToken })
          .then(pending.resolve)
          .catch(pending.reject)
      }

      return await replay({ config, token: newAccessToken })
    } catch (refreshError) {
      const refreshApiError = toApiError({ error: refreshError })

      // refreshToken까지 만료됐다 → 저장된 아이디·비밀번호로 재로그인한다.
      if (isTokenErrorCode(refreshApiError.code)) return enqueueAndStartAutoLogin(config)

      return Promise.reject(refreshApiError)
    } finally {
      isRefreshingToken = false
    }
  },
)

// ───────────────────────────────────────────────────────────────────────────────
// 자동 로그인 완료 후 큐 드레인
//
// 레거시는 `axios.js` 안에서 Vue `watch`로 `isAutoLoginInProgress`의 true→false
// 전이를 감시했다. Zustand `subscribe`가 같은 일을 한다.
// ───────────────────────────────────────────────────────────────────────────────

const drainAfterAutoLogin = async (): Promise<void> => {
  const accessToken = getAccessToken()
  const queued = takePendingRequests()

  // 토큰이 없다 = 자동 로그인 실패. 대기 요청을 전부 거부한다.
  if (!accessToken) {
    console.warn('[apiClient] 자동 로그인 실패: 대기 중인 요청을 모두 거부합니다.')
    queued.forEach(({ reject }) => {
      reject(new Error(AUTO_LOGIN_FAILED_MESSAGE))
    })
    return
  }

  const results = await Promise.allSettled(
    queued.map(({ config }) => {
      return replay({ config, token: accessToken })
    }),
  )

  results.forEach((result, index) => {
    const pending = queued[index]
    if (!pending) return

    if (result.status === 'fulfilled') {
      pending.resolve(result.value)
      return
    }
    pending.reject(result.reason)
  })
}

useAuthStore.subscribe((state, prevState) => {
  const hasFinishedAutoLogin = prevState.isAutoLoginInProgress && !state.isAutoLoginInProgress
  if (!hasFinishedAutoLogin || pendingRequests.length === 0) return

  void drainAfterAutoLogin()
})
