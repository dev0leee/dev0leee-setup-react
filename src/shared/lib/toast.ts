import { toast } from 'sonner'

import { TOAST_DURATION_MS, TOAST_ID } from '@/shared/constants/message'

/**
 * 토스트를 띄운다. 레거시 `lib/composables/useToast.js`의 `showToast` 대체물.
 *
 * ⚠️ **레거시는 토스트가 화면에 하나뿐이었다.** 모듈 스코프 `ref` 하나에 메시지를
 * 담고 타이머를 갈아끼웠다 — 연달아 부르면 **앞의 것이 사라지고 새 것만 보인다.**
 * sonner는 기본이 큐라 여러 개가 쌓이므로, **고정 id**를 줘서 같은 동작으로 맞췄다.
 *
 * 지속 시간 3초도 레거시 기본값 그대로다.
 *
 * 문구에 HTML을 넣지 않는다. 레거시는 `v-dompurify-html`로 렌더했지만 실제 호출부는
 * 전부 평문이었다 — HTML이 필요하면 `showErrorModal({ html })`을 쓴다.
 */
export const showToast = ({
  message,
  duration = TOAST_DURATION_MS,
}: {
  message: string
  duration?: number
}): void => {
  toast(message, { id: TOAST_ID, duration })
}
