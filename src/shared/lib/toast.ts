import type { ReactNode } from 'react'
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
 * ⚠️ **`message`가 `ReactNode`다.** 레거시 `ToastContainer.vue`는
 * `v-dompurify-html`로 렌더해서 문구에 `<br/>`을 넣는 호출부가 있다
 * (알림 설정의 동의 토스트 — `mypage.md` P4). HTML 문자열을 그대로 넘기면
 * 태그가 텍스트로 보이므로 **줄바꿈은 `<br />` 엘리먼트로 넘긴다.**
 * `dangerouslySetInnerHTML`은 쓰지 않는다 — 노드로 표현되는 것을 문자열 살균에
 * 맡길 이유가 없다. 서버 문구를 HTML로 렌더해야 하면 `showErrorModal({ html })`이다.
 */
export const showToast = ({
  message,
  duration = TOAST_DURATION_MS,
}: {
  message: ReactNode
  duration?: number
}): void => {
  toast(message, { id: TOAST_ID, duration })
}
