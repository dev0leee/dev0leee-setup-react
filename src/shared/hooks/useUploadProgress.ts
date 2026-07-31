import type { AxiosProgressEvent } from 'axios'
import { useState } from 'react'

/**
 * 업로드 진행률. 레거시 `lib/composables/useUploadProgress.js` 이식.
 *
 * `SpinnerDots`의 `progressPercent`로 흘러간다. **0이면 숫자를 그리지 않는다** —
 * 그래서 실패 시 `0`으로 되돌리면 퍼센트 표시가 사라진다(레거시 동일).
 */
export const useUploadProgress = () => {
  const [progressPercent, setProgressPercent] = useState(0)

  const onUploadProgress = (event: AxiosProgressEvent) => {
    if (!event.total) return

    setProgressPercent(Math.round((event.loaded * 100) / event.total))
  }

  return {
    progressPercent,
    onUploadProgress,
    onUploadSuccess: () => {
      setProgressPercent(100)
    },
    onUploadError: () => {
      setProgressPercent(0)
    },
  }
}
