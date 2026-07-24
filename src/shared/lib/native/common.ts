import { z } from 'zod'

import { sendToNative, subscribeToNative } from '@/shared/lib/native/bridge'

/** 앱 종료. 네이티브만 할 수 있다. */
export const exitApp = (): void => {
  sendToNative({ type: 'exitApp' })
}

/** 네이티브 하단 안전영역 높이 등 화면 정보 요청 */
export const requestSafeAreaInsets = (): void => {
  sendToNative({ type: 'requestSafeAreaInsets' })
}

const backButtonSchema = z.object({
  /** 네이티브가 뒤로가기를 눌렀을 때 현재 라우트 깊이 */
  canGoBack: z.boolean(),
})

/**
 * 네이티브 하드웨어 뒤로가기 구독.
 * 컴포넌트에서 쓸 때는 반환된 해제 함수를 effect cleanup으로 돌려준다.
 */
export const subscribeToBackButton = ({
  handler,
}: {
  handler: (canGoBack: boolean) => void
}): (() => void) => {
  return subscribeToNative({
    type: 'backButton',
    schema: backButtonSchema,
    handler: ({ canGoBack }) => {
      handler(canGoBack)
    },
  })
}
