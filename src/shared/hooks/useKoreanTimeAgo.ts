import { useSyncExternalStore } from 'react'

import { formatKoreanTimeAgo } from '@/shared/utils/formatKoreanTimeAgo'

/**
 * vueuse `useNow`의 기본 갱신 주기. `useTimeAgo`가 이 값으로 시계를 돌린다.
 * 목록에 `방금 전` → `1분 전`이 저절로 바뀌는 이유다.
 */
const UPDATE_INTERVAL_MS = 30_000

/**
 * **타이머 하나를 모든 구독자가 공유한다.** 레거시는 컴포저블을 부를 때마다 시계를
 * 하나씩 만들어 목록 10개면 타이머가 10개였다. 결과(30초마다 갱신)는 같으면서
 * 타이머는 하나면 되므로 공유 스토어로 만들었다 — 화면 동작에는 차이가 없다.
 */
let currentNow = Date.now()
const listeners = new Set<() => void>()
let intervalId: ReturnType<typeof setInterval> | null = null

const subscribe = (onStoreChange: () => void) => {
  listeners.add(onStoreChange)

  intervalId ??= setInterval(() => {
    currentNow = Date.now()
    listeners.forEach((listener) => {
      listener()
    })
  }, UPDATE_INTERVAL_MS)

  return () => {
    listeners.delete(onStoreChange)

    if (listeners.size === 0 && intervalId !== null) {
      clearInterval(intervalId)
      intervalId = null
    }
  }
}

const getSnapshot = () => {
  return currentNow
}

/**
 * 상대 시간을 한국어로 보여주고 30초마다 갱신한다.
 * 레거시 `useKoreanTimeAgo` + vueuse `useTimeAgo`의 조합에 대응한다.
 *
 * 계산 규칙은 `formatKoreanTimeAgo`에 있다 — 시계와 분리해 두어야 테스트할 수 있다.
 */
export const useKoreanTimeAgo = ({ dateString }: { dateString: string | undefined }): string => {
  // 서버 렌더가 없으므로 getServerSnapshot은 같은 값을 준다
  const now = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

  return formatKoreanTimeAgo({ dateString, now })
}
