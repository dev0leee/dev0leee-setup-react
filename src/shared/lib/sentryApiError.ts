import * as Sentry from '@sentry/react'
import type { AxiosError } from 'axios'

/** URL의 숫자·UUID 세그먼트를 묶어 Sentry 이슈가 요청마다 쪼개지지 않게 한다. */
const PARAM_SEGMENT = /\/([0-9]+|[0-9a-fA-F-]{8,})(?=\/|$)/g

const parseRequestData = (data: unknown): unknown => {
  if (typeof data !== 'string') return data
  try {
    return JSON.parse(data)
  } catch {
    return data
  }
}

/**
 * 5xx 응답을 Sentry로 보낸다. 레거시 `lib/sentry/sentryApiError.js` 이식.
 *
 * ⚠️ **인자 형태를 레거시와 다르게 받는다.** 레거시는 `sentryApiError(error.response)`로
 * 응답 객체를 넘겼는데, 함수 본문은 `error.message`·`error.response.data`·
 * `error.response.statusText`를 읽는다. 응답 객체에는 그 세 값이 없어
 * **응답 본문과 에러 메시지가 항상 비어 있었다.**
 * 사용자 화면에 영향이 없는 모니터링 페이로드이고 의도가 명확하므로
 * AxiosError 전체를 받아 값이 실제로 채워지게 고쳤다 (`deferred.md` D-191).
 */
export const sentryApiError = ({ error }: { error: AxiosError }): void => {
  const status = error.response?.status
  const baseURL = error.config?.baseURL ?? ''
  const method = error.config?.method?.toUpperCase()
  const originalUrl = error.config?.url?.split('?')[0] ?? ''
  const replacedPath = originalUrl.replace(PARAM_SEGMENT, '/{params}')

  const sentryError = new Error(error.message)
  sentryError.name = `[API] - ${status} ${baseURL}${replacedPath}`

  Sentry.captureException(sentryError, {
    tags: {
      'http.status': String(status),
      'http.method': method,
      'api.path': replacedPath,
    },
    // 같은 엔드포인트·같은 상태코드를 하나의 이슈로 묶는다.
    fingerprint: [method ?? '', replacedPath, String(status)],
    contexts: {
      request: {
        url: `${baseURL}${originalUrl}`,
        method,
        headers: error.config?.headers,
        data: parseRequestData(error.config?.data),
      },
      response: {
        status,
        statusText: error.response?.statusText,
        data: error.response?.data,
      },
    },
  })
}
