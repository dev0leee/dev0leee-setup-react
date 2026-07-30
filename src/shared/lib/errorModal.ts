import { useErrorModalStore } from '@/shared/stores/errorModalStore'
import type { ErrorModalOptions } from '@/shared/types/errorModal'

/**
 * 에러 모달을 띄운다. 레거시 `swalErrorModal({ ... })`의 대체물이다.
 *
 * 훅이 아니므로 컴포넌트 밖(뮤테이션 `onError` 등)에서도 부를 수 있다 —
 * 레거시 호출부 293곳이 전부 그런 위치다.
 *
 * ```ts
 * showErrorModal({ text: '아이디 또는 비밀번호가 일치하지 않습니다.' })
 * showErrorModal({ text: '세대에서 전출되었습니다.', icon: 'info' })
 * showErrorModal({ text: '만료되었습니다', callback: () => navigate('/') })
 * ```
 */
export const showErrorModal = (options: ErrorModalOptions = {}): void => {
  useErrorModalStore.getState().open(options)
}
